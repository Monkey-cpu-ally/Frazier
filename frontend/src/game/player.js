import { PL, C } from './constants';
import { sfx } from './sfx';

export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.w = PL.w; this.h = PL.h;
    this.facing = 1;
    this.grounded = false;
    this.onWall = false;
    this.wallDir = 0;
    this.coyoteT = 0;
    this.jumpBufT = 0;
    // Dash
    this.isDashing = false;
    this.canDash = true;
    this.dashTimer = 0;
    this.dashCooldownT = 0;
    this.dashDir = 1;
    // Attack
    this.state = 'idle';
    this.combo = 0;
    this.atkTimer = 0;
    this.atkCooldown = 0;
    this.comboTimer = 0;
    this.isAttacking = false;
    this.smashing = false;
    // Health
    this.invTimer = 0;
    this.knockTimer = 0;
    this.knockDir = 0;
    this.alive = true;
    // Visual
    this.animT = 0;
    this.landSquash = 0;
    this.atkFlash = 0;
    this.shadows = [];
    this.shadowTimer = 0;
    this.dashGhosts = [];
    this.wasGrounded = false;
    // Crouch
    this.crouching = false;
  }

  get left() { return this.x - this.w / 2; }
  get right() { return this.x + this.w / 2; }
  get top() { return this.y - this.h; }
  get bottom() { return this.y; }
  get cx() { return this.x; }
  get cy() { return this.y - this.h / 2; }

  getAtkBox() {
    if (this.smashing) {
      return {
        x: this.x - PL.smashBox.w / 2 + PL.smashBox.ox,
        y: this.y + PL.smashBox.oy - PL.smashBox.h / 2,
        w: PL.smashBox.w, h: PL.smashBox.h,
      };
    }
    return {
      x: this.x + PL.atkBox.ox * this.facing - (this.facing === -1 ? PL.atkBox.w : 0),
      y: this.cy + PL.atkBox.oy - PL.atkBox.h / 2,
      w: PL.atkBox.w, h: PL.atkBox.h,
    };
  }

  update(dt, engine) {
    const inp = engine.input;
    const pm = engine.powerManager;
    this.animT += dt;
    if (!this.alive) return;

    // Track active power color for aura effect rendered in render().
    this._powerColor = (pm && pm.active) ? pm.active.color : null;

    // Timers
    if (this.invTimer > 0) this.invTimer -= dt;
    if (this.atkCooldown > 0) this.atkCooldown -= dt;
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }
    if (this.landSquash > 0) this.landSquash -= dt * 6;
    if (this.dashCooldownT > 0) this.dashCooldownT -= dt;

    // Shadow tag trail
    if (pm.isShadowTag) {
      this.shadowTimer -= dt;
      if (this.shadowTimer <= 0) {
        this.shadows.push({ x: this.x, y: this.y, facing: this.facing, alpha: 0.6 });
        if (this.shadows.length > 5) this.shadows.shift();
        this.shadowTimer = 0.12;
      }
    } else { this.shadows = []; }
    this.shadows.forEach(s => { s.alpha -= dt * 1.5; });
    this.shadows = this.shadows.filter(s => s.alpha > 0);

    // Hyper Mode trail — emit magenta ghosts while moving fast
    if (engine.powerManager.isHyperMode && Math.abs(this.vx) > 40) {
      this.hyperTrailT = (this.hyperTrailT || 0) - dt;
      if (this.hyperTrailT <= 0) {
        this.hyperTrailT = 0.03;
        this.hyperTrail = this.hyperTrail || [];
        this.hyperTrail.push({ x: this.x, y: this.y, facing: this.facing, alpha: 0.65 });
        if (this.hyperTrail.length > 12) this.hyperTrail.shift();
      }
    }
    if (this.hyperTrail) {
      this.hyperTrail.forEach(t => { t.alpha -= dt * 2.5; });
      this.hyperTrail = this.hyperTrail.filter(t => t.alpha > 0);
    }

    // Dash ghosts
    this.dashGhosts.forEach(g => { g.alpha -= dt * 4; });
    this.dashGhosts = this.dashGhosts.filter(g => g.alpha > 0);

    // Coyote time
    if (this.grounded) {
      this.coyoteT = PL.coyote;
      this.canDash = true;
    } else {
      this.coyoteT = Math.max(0, this.coyoteT - dt);
    }

    // Jump buffer
    if (inp.jump) this.jumpBufT = PL.jumpBuf;
    else this.jumpBufT = Math.max(0, this.jumpBufT - dt);

    // Knockback
    if (this.knockTimer > 0) {
      this.knockTimer -= dt;
      this.vx = this.knockDir * PL.knockback;
      this.vy += PL.gravity * dt;
      if (this.vy > PL.maxFall) this.vy = PL.maxFall;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this._resolveCollisions(engine);
      return;
    }

    // Attack state
    if (this.isAttacking) {
      this._processAttack(dt, engine);
      return;
    }

    // Dash state
    if (this.isDashing) {
      this._processDash(dt, engine);
      return;
    }

    // === Normal state ===
    // Crouch — only on ground and only when not attacking/dashing.
    this.crouching = this.grounded && inp.dn && !this.isAttacking && !this.isDashing;
    this.h = this.crouching ? PL.h * 0.6 : PL.h;

    // Input direction
    let moveDir = 0;
    if (inp.left) moveDir = -1;
    if (inp.right) moveDir = 1;

    // Horizontal movement (Godot-style move_toward).
    // Crouch halves movement speed ("shuffle").
    const spdMul = (pm.isHyperMode ? 1.5 : pm.isSuperMode ? 1.4 : 1) * (this.crouching ? 0.4 : 1);
    const targetSpeed = moveDir * PL.speed * spdMul;
    if (Math.abs(targetSpeed) > 0.01) {
      this.vx = this._moveToward(this.vx, targetSpeed, PL.accel * dt);
      this.facing = moveDir;
    } else {
      this.vx = this._moveToward(this.vx, 0, PL.friction * dt);
    }

    // Gravity (Godot-style with multipliers)
    if (!this.grounded) {
      let grav = PL.gravity;
      if (this.vy > 0) {
        grav *= PL.fallGravMul;
      } else if (this.vy < 0 && !inp.jumpHeld) {
        grav *= PL.lowJumpGravMul;
      }
      // Biome / event gravity modifier (dream = 0.6, waterfall = 2.5)
      const envMul = engine.waterfallActive ? 2.5 : (engine.gravityMul || 1);
      grav *= envMul;
      this.vy += grav * dt;
      this.vy = Math.min(this.vy, PL.maxFall);
    }

    // Jump
    if (this.jumpBufT > 0 && (this.grounded || this.coyoteT > 0)) {
      const jumpMul = engine.waterfallActive ? 0.5 : (pm.isSuperMode ? 1.15 : 1);
      this.vy = PL.jumpV * jumpMul;
      this.grounded = false;
      this.coyoteT = 0;
      this.jumpBufT = 0;
      this.state = 'jumping';
      sfx.jump();
    }

    // Wall slide
    if (!this.grounded && this.onWall && moveDir !== 0 && this.vy > 0) {
      this.vy = Math.min(this.vy, PL.wallSlideSpd);
      this.state = 'wall_slide';
    }

    // Wall jump
    if (inp.jump && !this.grounded && this.onWall) {
      this.vx = this.wallDir * PL.wallJumpX;
      this.vy = PL.wallJumpY;
      this.facing = this.wallDir;
      this.coyoteT = 0;
      this.jumpBufT = 0;
      sfx.jump();
      if (engine.achievements) engine.achievements.onWallJump();
    }

    // Dash (daily modifier may disable)
    const dashBlocked = engine.dailyMode && engine.dailyModifier && engine.dailyModifier.no_dash;
    if (inp.dash && this.canDash && this.dashCooldownT <= 0 && !dashBlocked) {
      this.isDashing = true;
      this.canDash = false;
      this.dashTimer = PL.dashTime;
      this.dashDir = moveDir !== 0 ? moveDir : this.facing;
      this.vx = this.dashDir * PL.dashSpeed;
      this.vy = 0;
      sfx.wrenchSwing();
      if (engine.achievements) engine.achievements.onDash();
      return;
    }

    // Attack
    if (inp.attack && this.atkCooldown <= 0) {
      if (!this.grounded && inp.dn) {
        this.smashing = true;
        this.atkTimer = 0.5;
        this.isAttacking = true;
        this.state = 'smashing';
        this.vy = PL.smashSpeed;
        this.atkFlash = 0.1;
        sfx.smash();
      } else if (!this.grounded) {
        this.atkTimer = PL.airAtkDur;
        this.isAttacking = true;
        this.state = 'air_attack';
        this.atkFlash = 0.1;
        sfx.wrenchSwing();
      } else {
        this.combo = (this.comboTimer > 0) ? Math.min(this.combo + 1, PL.maxCombo) : 1;
        this.atkTimer = PL.atkDur[this.combo - 1] || PL.atkDur[0];
        this.comboTimer = PL.comboReset;
        this.isAttacking = true;
        this.state = 'attacking';
        this.atkFlash = 0.1;
        if (this.combo === 3) {
          sfx.comboFinish();
          if (engine.achievements) engine.achievements.onComboFinished();
        }
        else sfx.wrenchSwing();
      }
      return;
    }

    // Update state
    if (this.grounded) {
      this.state = Math.abs(this.vx) > 15 ? 'running' : 'idle';
    } else {
      if (this.onWall && this.vy > 0) this.state = 'wall_slide';
      else this.state = this.vy < 0 ? 'jumping' : 'falling';
    }

    // Apply velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this._resolveCollisions(engine);
  }

  _processAttack(dt, engine) {
    this.atkTimer -= dt;
    // Friction during attack
    this.vx = this._moveToward(this.vx, 0, PL.friction * dt);
    // Gravity
    if (!this.grounded) {
      this.vy += PL.gravity * dt;
      if (this.vy > PL.maxFall) this.vy = PL.maxFall;
    }
    if (this.smashing) {
      this.vy = PL.smashSpeed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this._resolveCollisions(engine);

    if (this.atkTimer <= 0) {
      this.isAttacking = false;
      this.smashing = false;
      this.atkCooldown = PL.atkCooldown;
      if (this.combo >= PL.maxCombo) this.combo = 0;
    }
  }

  _processDash(dt, engine) {
    this.dashTimer -= dt;
    this.vx = this.dashDir * PL.dashSpeed;
    this.vy = 0;
    // Add dash ghost
    if (Math.random() < 0.6) {
      this.dashGhosts.push({ x: this.x, y: this.y, facing: this.facing, alpha: 0.5 });
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this._resolveCollisions(engine);

    if (this.dashTimer <= 0) {
      this.isDashing = false;
      this.dashCooldownT = PL.dashCooldown;
      this.vx *= 0.3; // Reduce speed after dash
    }
  }

  _moveToward(current, target, step) {
    if (current < target) return Math.min(current + step, target);
    if (current > target) return Math.max(current - step, target);
    return target;
  }

  _resolveCollisions(engine) {
    const prevGrounded = this.grounded;
    this.grounded = false;
    this.onWall = false;
    this.wallDir = 0;

    for (const p of engine.platforms) {
      if (this.right <= p.x || this.left >= p.x + p.w) continue;
      if (this.bottom <= p.y || this.top >= p.y + p.h) continue;

      const overlapL = this.right - p.x;
      const overlapR = (p.x + p.w) - this.left;
      const overlapT = this.bottom - p.y;
      const overlapB = (p.y + p.h) - this.top;
      const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

      if (minOverlap === overlapT && this.vy >= 0) {
        this.y = p.y;
        this.vy = 0;
        this.grounded = true;
        if (!prevGrounded && this.smashing) {
          this.smashing = false;
          this.isAttacking = false;
          this.atkTimer = 0;
          this.landSquash = 1;
          engine.camera.shake(6, 0.15);
          engine.addParticles(this.x, this.y, 8, C.ground);
          sfx.smash();
        } else if (!prevGrounded) {
          this.landSquash = 0.5;
          sfx.land();
        }
      } else if (minOverlap === overlapB && this.vy < 0) {
        this.y = p.y + p.h + this.h;
        this.vy = 0;
      } else if (minOverlap === overlapL) {
        this.x = p.x - this.w / 2;
        this.vx = 0;
        this.onWall = true;
        this.wallDir = -1;
      } else if (minOverlap === overlapR) {
        this.x = p.x + p.w + this.w / 2;
        this.vx = 0;
        this.onWall = true;
        this.wallDir = 1;
      }
    }

    // Death pit
    if (this.y > engine.deathY) {
      this.alive = false;
    }

    // Horizontal bounds — prevents walking off the side of the stage.
    if (engine.playerMinX !== undefined && this.x < engine.playerMinX + this.w / 2) {
      this.x = engine.playerMinX + this.w / 2;
      if (this.vx < 0) this.vx = 0;
    }
    if (engine.playerMaxX !== undefined && this.x > engine.playerMaxX - this.w / 2) {
      this.x = engine.playerMaxX - this.w / 2;
      if (this.vx > 0) this.vx = 0;
    }
  }

  takeDamage(dmg, fromX, engine) {
    if (this.invTimer > 0 || engine.powerManager.isSpecterMode || this.isDashing) return;
    // Daily modifier: dmg_taken_mul
    if (engine.dailyMode && engine.dailyModifier && engine.dailyModifier.dmg_taken_mul) {
      dmg = Math.max(1, Math.ceil(dmg * engine.dailyModifier.dmg_taken_mul));
    }
    this.knockDir = fromX < this.x ? 1 : -1;
    this.knockTimer = PL.knockDur;
    this.invTimer = PL.invTime;
    this.vy = -200;
    this.isAttacking = false;
    this.isDashing = false;
    const dead = engine.gameState.chipSticker(dmg >= 2);
    if (dead) this.alive = false;
    engine.camera.shake(dmg >= 2 ? 8 : 4, 0.2);
    engine.addParticles(this.x, this.cy, 6, C.red);
    sfx.playerHurt();
    if (engine.achievements) engine.achievements.onPlayerDamaged();
  }

  render(ctx, engine) {
    if (!this.alive) return;
    // Snapshot sprite for sub-draws (dash ghosts, hyper trail, shadow trail).
    this._spriteImg = engine && engine.sprites && engine.sprites.axel && engine.sprites.axel.loaded
                       ? engine.sprites.axel : null;
    // Damage flicker — keep ouch face visible but semi-transparent on flicker frames.
    const flickerOff = this.invTimer > 0 && Math.floor(this.invTimer * 10) % 2 === 0;
    if (flickerOff) ctx.globalAlpha = 0.35;

    // Power aura — pulsing ring behind Axel that matches the active power's color.
    // Always drawn so the player feels the power is doing something.
    if (this._powerColor) {
      const pulse = 0.75 + 0.25 * Math.sin(this.animT * 6);
      ctx.save();
      ctx.globalAlpha = 0.35 * pulse;
      ctx.fillStyle = this._powerColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y - this.h / 2, 32 + 4 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(this.x, this.y - this.h / 2, 48 + 6 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Dash ghosts
    this.dashGhosts.forEach(g => {
      ctx.globalAlpha = g.alpha * 0.3;
      this._drawBody(ctx, g.x, g.y, g.facing);
      ctx.globalAlpha = 1;
    });

    // Hyper Mode magenta trail
    if (this.hyperTrail) {
      this.hyperTrail.forEach(t => {
        ctx.save();
        ctx.globalAlpha = t.alpha * 0.7;
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = 'hue-rotate(300deg) saturate(2) brightness(1.2)';
        this._drawBody(ctx, t.x, t.y, t.facing);
        ctx.filter = 'none';
        ctx.restore();
      });
    }

    // Shadow tag shadows
    this.shadows.forEach(s => {
      ctx.globalAlpha = s.alpha * 0.4;
      this._drawBody(ctx, s.x, s.y, s.facing);
      ctx.globalAlpha = 1;
    });

    const squashX = (1 + this.landSquash * 0.3) * (this.crouching ? 1.2 : 1);
    const squashY = (1 - this.landSquash * 0.2) * (this.crouching ? 0.55 : 1);

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.scale(squashX, squashY);

    if (this.atkFlash > 0) {
      this.atkFlash -= 0.016;
      ctx.globalAlpha = 0.85;
    }

    // Dash afterimage tint
    if (this.isDashing) {
      ctx.globalAlpha = 0.8;
    }

    this._drawBody(ctx, 0, 0, this.facing);

    // Wrench during attack
    if (this.isAttacking && !this.smashing) {
      this._drawWrench(ctx, this.facing);
    }
    if (this.smashing) {
      this._drawSmashEffect(ctx);
    }

    // Wall slide particles
    if (this.state === 'wall_slide') {
      ctx.fillStyle = 'rgba(180,160,120,0.5)';
      for (let i = 0; i < 3; i++) {
        const py = -this.h * Math.random();
        ctx.fillRect(this.wallDir * -12, py, 2 + Math.random() * 2, 3);
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  _drawBody(ctx, ox, oy, face) {
    const x = ox, y = oy;
    const OL = 2;

    // Outline pass
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(x - 8 - OL, y - 6 - OL, 6 + OL*2, 6 + OL*2);
    ctx.fillRect(x + 2 - OL, y - 6 - OL, 6 + OL*2, 6 + OL*2);
    ctx.fillRect(x - 7 - OL, y - 16 - OL, 5 + OL*2, 10 + OL*2);
    ctx.fillRect(x + 2 - OL, y - 16 - OL, 5 + OL*2, 10 + OL*2);
    ctx.fillRect(x - 10 - OL, y - 34 - OL, 20 + OL*2, 18 + OL*2);
    ctx.fillRect(x - 14 - OL, y - 32 - OL, 5 + OL*2, 15 + OL*2);
    ctx.fillRect(x + 9 - OL, y - 32 - OL, 5 + OL*2, 15 + OL*2);
    ctx.fillRect(x - 9 - OL, y - 48 - OL, 18 + OL*2, 14 + OL*2);
    ctx.fillRect(x - 11 - OL, y - 54 - OL, 22 + OL*2, 8 + OL*2);
    ctx.fillRect(x - 13 - OL, y - 48 - OL, 26 + OL*2, 3 + OL*2);
    ctx.beginPath();
    ctx.arc(x - 10, y - 44, 6 + OL, 0, Math.PI * 2);
    ctx.arc(x + 10, y - 44, 6 + OL, 0, Math.PI * 2);
    ctx.fill();

    // Color pass
    ctx.fillStyle = C.boot;
    ctx.fillRect(x - 8, y - 6, 6, 6);
    ctx.fillRect(x + 2, y - 6, 6, 6);
    ctx.fillStyle = C.outfit;
    ctx.fillRect(x - 7, y - 16, 5, 10);
    ctx.fillRect(x + 2, y - 16, 5, 10);
    ctx.fillStyle = C.outfit;
    ctx.fillRect(x - 10, y - 34, 20, 18);
    ctx.fillStyle = C.outfitDk;
    ctx.fillRect(x - 10, y - 34, 20, 3);
    ctx.fillStyle = C.outfitDk;
    ctx.fillRect(x - 6, y - 26, 5, 4);
    ctx.fillRect(x + 2, y - 26, 5, 4);
    ctx.fillStyle = C.belt;
    ctx.fillRect(x - 10, y - 18, 20, 3);
    ctx.fillStyle = C.yellow;
    ctx.fillRect(x - 2, y - 18, 4, 3);
    ctx.fillStyle = C.skin;
    ctx.fillRect(x - 14, y - 32, 5, 10);
    ctx.fillRect(x + 9, y - 32, 5, 10);
    ctx.fillStyle = C.glove;
    ctx.fillRect(x - 14, y - 22, 5, 5);
    ctx.fillRect(x + 9, y - 22, 5, 5);
    ctx.fillStyle = C.skin;
    ctx.fillRect(x - 9, y - 48, 18, 14);
    ctx.fillStyle = C.hair;
    ctx.beginPath();
    ctx.arc(x - 10, y - 44, 6, 0, Math.PI * 2);
    ctx.arc(x + 10, y - 44, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.cap;
    ctx.fillRect(x - 11, y - 54, 22, 8);
    ctx.fillStyle = C.capDk;
    ctx.fillRect(x - 13, y - 48, 26, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x - 4, y - 53, 8, 2);
    ctx.fillStyle = C.capDk;
    ctx.fillRect(x + (face === 1 ? 2 : -14), y - 46, 12, 3);
    ctx.fillStyle = C.eyeW;
    ctx.fillRect(x - 6, y - 45, 6, 6);
    ctx.fillRect(x + 1, y - 45, 6, 6);
    ctx.fillStyle = C.eye;
    const ep = face === 1 ? 2 : 0;
    // ── Damage expression: X eyes + frown when invulnerable ──
    if (this.invTimer > 0) {
      // X eyes
      ctx.fillStyle = C.eye;
      // left X
      ctx.fillRect(x - 6, y - 45, 1, 6);
      ctx.fillRect(x - 1, y - 45, 1, 6);
      ctx.fillRect(x - 5, y - 45, 1, 1);
      ctx.fillRect(x - 4, y - 44, 1, 1);
      ctx.fillRect(x - 3, y - 43, 1, 1);
      ctx.fillRect(x - 4, y - 41, 1, 1);
      ctx.fillRect(x - 5, y - 40, 1, 1);
      // right X
      ctx.fillRect(x + 1, y - 45, 1, 6);
      ctx.fillRect(x + 6, y - 45, 1, 6);
      ctx.fillRect(x + 2, y - 44, 1, 1);
      ctx.fillRect(x + 3, y - 43, 1, 1);
      ctx.fillRect(x + 4, y - 44, 1, 1);
      ctx.fillRect(x + 5, y - 45, 1, 1);
      // frown / owie mouth
      ctx.fillStyle = C.red;
      ctx.fillRect(x - 3, y - 36, 6, 2);
      ctx.fillStyle = C.noseBand;
      ctx.fillRect(x - 3, y - 39, 6, 3);
      return; // skip normal face
    }
    ctx.fillRect(x - 5 + ep, y - 44, 3, 4);
    ctx.fillRect(x + 2 + ep, y - 44, 3, 4);
    ctx.fillStyle = C.eyeW;
    ctx.fillRect(x - 5 + ep, y - 44, 1, 1);
    ctx.fillRect(x + 2 + ep, y - 44, 1, 1);
    ctx.fillStyle = C.noseBand;
    ctx.fillRect(x - 3, y - 39, 6, 3);
    ctx.fillStyle = C.skinDk;
    ctx.fillRect(x - 1 + face, y - 36, 3, 1);
  }

  _drawWrench(ctx, face) {
    const angle = this.combo === 1 ? -0.4 : this.combo === 2 ? 0.3 : -0.8;
    ctx.save();
    ctx.translate(face * 14, -28);
    ctx.rotate(angle * face);
    ctx.fillStyle = C.wrenchHandle;
    ctx.fillRect(-2, -2, 4, 18);
    ctx.fillStyle = this.skinColor || C.wrench;
    ctx.fillRect(-5, -8, 10, 8);
    ctx.fillRect(-3, -10, 2, 4);
    ctx.fillRect(1, -10, 2, 4);
    ctx.restore();
  }

  _drawSmashEffect(ctx) {
    ctx.fillStyle = C.yellow;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(-6, 2, 12, 8);
    ctx.globalAlpha = 1;
  }
}
