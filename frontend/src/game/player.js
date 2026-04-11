import { PL, GRAVITY, MAX_FALL, C } from './constants';
import { sfx } from './sfx';

export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.w = PL.w; this.h = PL.h;
    this.facing = 1;
    this.grounded = false;
    this.coyoteT = 0;
    this.jumpBufT = 0;
    this.state = 'idle';
    this.combo = 0;
    this.atkTimer = 0;
    this.atkCooldown = 0;
    this.comboTimer = 0;
    this.invTimer = 0;
    this.knockTimer = 0;
    this.knockDir = 0;
    this.smashing = false;
    this.alive = true;
    this.animT = 0;
    this.landSquash = 0;
    this.atkFlash = 0;
    this.shadows = [];
    this.shadowTimer = 0;
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

    if (this.invTimer > 0) this.invTimer -= dt;
    if (this.atkCooldown > 0) this.atkCooldown -= dt;
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }
    if (this.landSquash > 0) this.landSquash -= dt * 6;

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

    // Knockback
    if (this.knockTimer > 0) {
      this.knockTimer -= dt;
      this.vx = this.knockDir * PL.knockback;
      this.vy += GRAVITY * dt;
      if (this.vy > MAX_FALL) this.vy = MAX_FALL;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this._resolveCollisions(engine);
      return;
    }

    // Attack state
    if (this.atkTimer > 0) {
      this.atkTimer -= dt;
      this.vy += GRAVITY * dt;
      if (this.vy > MAX_FALL) this.vy = MAX_FALL;
      if (!this.grounded) this.y += this.vy * dt;
      if (this.smashing) {
        this.vy = PL.smashSpeed;
        this.y += this.vy * dt;
      }
      this._resolveCollisions(engine);
      if (this.atkTimer <= 0) {
        this.smashing = false;
        this.atkCooldown = PL.atkCooldown;
        this.state = this.grounded ? 'idle' : 'falling';
      }
      return;
    }

    // Horizontal movement
    const spdMul = pm.isSuperMode ? 1.4 : 1;
    let moveDir = 0;
    if (inp.left) moveDir = -1;
    if (inp.right) moveDir = 1;

    if (moveDir !== 0) {
      this.facing = moveDir;
      const acc = (this.grounded ? PL.accel : PL.accel * PL.airMul) * spdMul;
      this.vx += moveDir * acc * dt;
      const ms = PL.speed * spdMul;
      if (Math.abs(this.vx) > ms) this.vx = moveDir * ms;
      this.state = this.grounded ? 'running' : (this.vy < 0 ? 'jumping' : 'falling');
    } else {
      const fric = this.grounded ? PL.friction : PL.friction * 0.5;
      if (this.vx > 0) { this.vx = Math.max(0, this.vx - fric * dt); }
      else if (this.vx < 0) { this.vx = Math.min(0, this.vx + fric * dt); }
      if (this.grounded && Math.abs(this.vx) < 5) this.state = 'idle';
    }

    // Coyote time
    if (this.grounded) this.coyoteT = PL.coyote;
    else this.coyoteT -= dt;

    // Jump buffer
    if (inp.jump) this.jumpBufT = PL.jumpBuf;
    else this.jumpBufT -= dt;

    // Jump
    if (this.jumpBufT > 0 && this.coyoteT > 0) {
      this.vy = PL.jumpV * (pm.isSuperMode ? 1.15 : 1);
      this.grounded = false;
      this.coyoteT = 0;
      this.jumpBufT = 0;
      this.state = 'jumping';
      sfx.jump();
    }

    // Variable jump
    if (inp.jumpRel && this.vy < 0) {
      this.vy *= PL.jumpCut;
    }

    // Attack
    if (inp.attack && this.atkCooldown <= 0) {
      if (!this.grounded && inp.dn) {
        this.smashing = true;
        this.atkTimer = 0.5;
        this.state = 'smashing';
        this.vy = PL.smashSpeed;
        this.atkFlash = 0.1;
        sfx.smash();
      } else if (!this.grounded) {
        this.atkTimer = PL.airAtkDur;
        this.state = 'air_attack';
        this.atkFlash = 0.1;
        sfx.wrenchSwing();
      } else {
        this.combo = (this.comboTimer > 0) ? Math.min(this.combo + 1, PL.maxCombo) : 1;
        this.atkTimer = PL.atkDur[this.combo - 1] || PL.atkDur[0];
        this.comboTimer = PL.comboReset;
        this.state = 'attacking';
        this.atkFlash = 0.1;
        this.vx = this.facing * 80;
        if (this.combo === 3) sfx.comboFinish();
        else sfx.wrenchSwing();
      }
    }

    // Gravity
    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;

    // Apply velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this._resolveCollisions(engine);
  }

  _resolveCollisions(engine) {
    const prevGrounded = this.grounded;
    this.grounded = false;

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
      } else if (minOverlap === overlapR) {
        this.x = p.x + p.w + this.w / 2;
        this.vx = 0;
      }
    }

    // Death pit
    if (this.y > engine.deathY) {
      this.alive = false;
    }
  }

  takeDamage(dmg, fromX, engine) {
    if (this.invTimer > 0 || engine.powerManager.isSpecterMode) return;
    this.knockDir = fromX < this.x ? 1 : -1;
    this.knockTimer = PL.knockDur;
    this.invTimer = PL.invTime;
    this.vy = -200;
    const dead = engine.gameState.chipSticker(dmg >= 2);
    if (dead) this.alive = false;
    engine.camera.shake(dmg >= 2 ? 8 : 4, 0.2);
    engine.addParticles(this.x, this.cy, 6, C.red);
    sfx.playerHurt();
  }

  render(ctx) {
    if (!this.alive) return;
    const blink = this.invTimer > 0 && Math.floor(this.invTimer * 10) % 2 === 0;
    if (blink) return;

    // Shadows
    this.shadows.forEach(s => {
      ctx.globalAlpha = s.alpha * 0.4;
      this._drawBody(ctx, s.x, s.y, s.facing);
      ctx.globalAlpha = 1;
    });

    const squashX = 1 + this.landSquash * 0.3;
    const squashY = 1 - this.landSquash * 0.2;

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.scale(squashX, squashY);

    // Attack flash
    if (this.atkFlash > 0) {
      this.atkFlash -= 0.016;
      ctx.globalAlpha = 0.85;
    }

    this._drawBody(ctx, 0, 0, this.facing);

    // Wrench during attack
    if (this.atkTimer > 0 && !this.smashing) {
      this._drawWrench(ctx, this.facing);
    }
    if (this.smashing) {
      this._drawSmashEffect(ctx);
    }

    ctx.restore();
  }

  _drawBody(ctx, ox, oy, face) {
    const x = ox, y = oy;
    // Boots
    ctx.fillStyle = C.boot;
    ctx.fillRect(x - 8, y - 6, 6, 6);
    ctx.fillRect(x + 2, y - 6, 6, 6);
    // Legs
    ctx.fillStyle = C.outfit;
    ctx.fillRect(x - 7, y - 16, 5, 10);
    ctx.fillRect(x + 2, y - 16, 5, 10);
    // Body
    ctx.fillStyle = C.outfit;
    ctx.fillRect(x - 10, y - 34, 20, 18);
    ctx.fillStyle = C.outfitDk;
    ctx.fillRect(x - 10, y - 34, 20, 3);
    // Belt
    ctx.fillStyle = C.belt;
    ctx.fillRect(x - 10, y - 18, 20, 3);
    // Arms
    ctx.fillStyle = C.skin;
    ctx.fillRect(x - 14, y - 32, 5, 10);
    ctx.fillRect(x + 9, y - 32, 5, 10);
    // Gloves
    ctx.fillStyle = C.glove;
    ctx.fillRect(x - 14, y - 22, 5, 5);
    ctx.fillRect(x + 9, y - 22, 5, 5);
    // Head
    ctx.fillStyle = C.skin;
    ctx.fillRect(x - 9, y - 48, 18, 14);
    // Hair puffs
    ctx.fillStyle = C.hair;
    ctx.beginPath();
    ctx.arc(x - 10, y - 44, 6, 0, Math.PI * 2);
    ctx.arc(x + 10, y - 44, 6, 0, Math.PI * 2);
    ctx.fill();
    // Cap
    ctx.fillStyle = C.cap;
    ctx.fillRect(x - 11, y - 54, 22, 8);
    ctx.fillStyle = C.capDk;
    ctx.fillRect(x - 13, y - 48, 26, 3);
    // Brim
    ctx.fillStyle = C.capDk;
    ctx.fillRect(x + (face === 1 ? 2 : -14), y - 46, 12, 3);
    // Eyes
    ctx.fillStyle = C.eyeW;
    ctx.fillRect(x - 5, y - 44, 5, 5);
    ctx.fillRect(x + 2, y - 44, 5, 5);
    ctx.fillStyle = C.eye;
    const ep = face === 1 ? 2 : 0;
    ctx.fillRect(x - 5 + ep, y - 43, 3, 3);
    ctx.fillRect(x + 2 + ep, y - 43, 3, 3);
    // Nose bandage
    ctx.fillStyle = C.noseBand;
    ctx.fillRect(x - 3, y - 39, 6, 3);
  }

  _drawWrench(ctx, face) {
    const angle = this.combo === 1 ? -0.4 : this.combo === 2 ? 0.3 : -0.8;
    ctx.save();
    ctx.translate(face * 14, -28);
    ctx.rotate(angle * face);
    ctx.fillStyle = C.wrenchHandle;
    ctx.fillRect(-2, -2, 4, 18);
    ctx.fillStyle = C.wrench;
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
