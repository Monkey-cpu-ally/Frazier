import { GRAVITY, MAX_FALL, C } from './constants';

// Rootbound Siege Tank - Boss Entity
// Attack/Vulnerable/Recover loop with multiple attack patterns

export class Boss {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = 80; this.h = 60;
    this.vx = 0; this.vy = 0;
    this.hp = 12; this.maxHp = 12;
    this.alive = true;
    this.phase = 'idle'; // idle, charge, slam, vulnerable, recover, dying
    this.phaseTimer = 0;
    this.stateTimer = 0;
    this.attackCount = 0;
    this.facing = -1;
    this.flashTimer = 0;
    this.hurtTimer = 0;
    this.shakeX = 0;
    this.animT = 0;
    this.defeated = false;
    this.deathTimer = 0;
    this.arenaLeft = -200;
    this.arenaRight = 800;
    this.warningTimer = 0;
    this.chargeSpeed = 350;
    this.slamming = false;
    this.vulnerableTime = 3.0;
    this.recoverTime = 1.5;
    this.projectiles = [];
    this.roarPlayed = false;
  }

  get left() { return this.x - this.w / 2; }
  get right() { return this.x + this.w / 2; }
  get top() { return this.y - this.h; }
  get bottom() { return this.y; }
  get cx() { return this.x; }
  get cy() { return this.y - this.h / 2; }

  getHitbox() { return { x: this.left, y: this.top, w: this.w, h: this.h }; }

  activate(engine) {
    this.phase = 'intro';
    this.phaseTimer = 1.5;
    this.roarPlayed = false;
    engine.flightLog.add('WARNING: Siege Tank detected', 'combat');
  }

  update(dt, engine) {
    if (!this.alive) {
      this.deathTimer -= dt;
      // Death explosion particles
      if (this.deathTimer > 0 && Math.random() < 0.3) {
        const ox = (Math.random() - 0.5) * this.w;
        const oy = (Math.random() - 0.5) * this.h;
        engine.addParticles(this.cx + ox, this.cy + oy, 3, C.red);
      }
      return;
    }

    this.animT += dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.warningTimer > 0) this.warningTimer -= dt;
    this.shakeX = this.hurtTimer > 0 ? (Math.random() - 0.5) * 4 : 0;

    // Update projectiles
    this.projectiles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
      p.life -= dt;
    });
    this.projectiles = this.projectiles.filter(p => p.life > 0);

    // Check projectile vs player
    const pl = engine.player;
    this.projectiles.forEach(p => {
      if (Math.abs(p.x - pl.x) < 20 && Math.abs(p.y - pl.cy) < 30) {
        pl.takeDamage(1, p.x, engine);
        p.life = 0;
      }
    });

    this.phaseTimer -= dt;
    this.stateTimer += dt;

    switch (this.phase) {
      case 'intro':
        if (!this.roarPlayed && this.phaseTimer < 1.0) {
          this.roarPlayed = true;
          if (engine.sfx) engine.sfx.bossRoar();
        }
        if (this.phaseTimer <= 0) {
          this._pickAttack(engine);
        }
        break;

      case 'telegraph':
        // Warning before attack
        this.warningTimer = this.phaseTimer;
        if (this.phaseTimer <= 0) {
          this._executeAttack(engine);
        }
        break;

      case 'charge':
        this.vx = this.facing * this.chargeSpeed * (this.hp < 6 ? 1.3 : 1);
        this.x += this.vx * dt;
        // Wall bounce
        if (this.x <= this.arenaLeft + 40 || this.x >= this.arenaRight - 40) {
          this.vx = 0;
          this.x = Math.max(this.arenaLeft + 40, Math.min(this.x, this.arenaRight - 40));
          this.phase = 'vulnerable';
          this.phaseTimer = this.vulnerableTime;
          engine.camera.shake(8, 0.2);
          engine.addParticles(this.cx, this.cy, 10, C.hvBody);
          if (engine.sfx) engine.sfx.bossVulnerable();
        }
        // Damage player on contact during charge
        if (this._touchingPlayer(engine.player)) {
          engine.player.takeDamage(2, this.cx, engine);
        }
        break;

      case 'slam':
        if (!this.slamming) {
          this.vy = -400;
          this.slamming = true;
        }
        this.vy += GRAVITY * 1.5 * dt;
        this.y += this.vy * dt;
        // Land
        if (this.y >= 286) {
          this.y = 286;
          this.vy = 0;
          this.slamming = false;
          engine.camera.shake(10, 0.25);
          engine.addParticles(this.cx, this.y, 12, C.ground);
          if (engine.sfx) engine.sfx.smash();
          // Spawn debris projectiles
          for (let i = 0; i < 4; i++) {
            this.projectiles.push({
              x: this.cx + (Math.random() - 0.5) * 60,
              y: this.y - 10,
              vx: (Math.random() - 0.5) * 300,
              vy: -200 - Math.random() * 150,
              life: 1.5,
            });
          }
          this.attackCount++;
          if (this.attackCount >= 3) {
            this.phase = 'vulnerable';
            this.phaseTimer = this.vulnerableTime;
            this.attackCount = 0;
            if (engine.sfx) engine.sfx.bossVulnerable();
          } else {
            this.phase = 'telegraph';
            this.phaseTimer = 0.6;
          }
        }
        break;

      case 'vulnerable':
        // Boss stunned, can be hit
        const bob = Math.sin(this.animT * 8) * 2;
        this.shakeX = bob;
        if (this.phaseTimer <= 0) {
          this.phase = 'recover';
          this.phaseTimer = this.recoverTime;
          this.shakeX = 0;
        }
        break;

      case 'recover':
        if (this.phaseTimer <= 0) {
          this._pickAttack(engine);
        }
        break;

      case 'dying':
        this.deathTimer -= dt;
        if (this.deathTimer <= 0) {
          this.alive = false;
          this.defeated = true;
        }
        break;

      default:
        break;
    }
  }

  _pickAttack(engine) {
    const pl = engine.player;
    this.facing = pl.x < this.x ? -1 : 1;

    // Alternate between charge and slam, get faster at low HP
    const pattern = this.hp < 6 ? Math.random() : (this.attackCount % 2 === 0 ? 0 : 1);
    if (pattern < 0.5) {
      this.phase = 'telegraph';
      this.phaseTimer = this.hp < 6 ? 0.5 : 0.8;
      this._nextAttack = 'charge';
    } else {
      this.phase = 'telegraph';
      this.phaseTimer = 0.6;
      this._nextAttack = 'slam';
    }
    this.stateTimer = 0;
  }

  _executeAttack(engine) {
    if (this._nextAttack === 'charge') {
      this.phase = 'charge';
      this.phaseTimer = 5; // max charge time
      if (engine.sfx) engine.sfx.bossRoar();
    } else {
      this.phase = 'slam';
      this.phaseTimer = 3;
      this.slamming = false;
    }
  }

  _touchingPlayer(pl) {
    return pl.right > this.left && pl.left < this.right &&
           pl.bottom > this.top && pl.top < this.bottom;
  }

  takeDamage(amount, fromX, engine) {
    if (this.phase !== 'vulnerable') return false;
    this.hp -= amount;
    this.flashTimer = 0.1;
    this.hurtTimer = 0.15;
    engine.hitStopTimer = 0.06;
    engine.addParticles(this.cx, this.cy, 5, C.hvAccent);
    if (engine.sfx) engine.sfx.bossHit();

    if (this.hp <= 0) {
      this.phase = 'dying';
      this.deathTimer = 2.0;
      if (engine.sfx) engine.sfx.bossDeath();
      engine.flightLog.add('Siege Tank destroyed!', 'combat');
      engine.camera.shake(12, 0.5);
      return true;
    }
    return false;
  }

  render(ctx) {
    if (!this.alive && this.deathTimer <= 0 && !this.defeated) return;

    const dying = this.phase === 'dying';
    if (dying) {
      ctx.globalAlpha = Math.max(0, this.deathTimer / 2);
    }
    if (!this.alive && this.defeated) return;

    const x = Math.round(this.x + this.shakeX);
    const y = Math.round(this.y);
    const flash = this.flashTimer > 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, 36, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Treads
    ctx.fillStyle = flash ? C.white : '#3A4A56';
    ctx.fillRect(x - 38, y - 14, 18, 14);
    ctx.fillRect(x + 20, y - 14, 18, 14);

    // Main hull
    ctx.fillStyle = flash ? C.white : C.hvBody;
    ctx.beginPath();
    ctx.moveTo(x - 36, y - 20);
    ctx.lineTo(x - 30, y - 50);
    ctx.lineTo(x + 30, y - 50);
    ctx.lineTo(x + 36, y - 20);
    ctx.closePath();
    ctx.fill();

    // Armor plates
    ctx.fillStyle = flash ? C.yellow : C.hvPlate;
    ctx.fillRect(x - 28, y - 46, 56, 6);
    ctx.fillRect(x - 32, y - 24, 64, 6);

    // Root overgrowth (nature reclaiming machine)
    ctx.fillStyle = '#4A7A4A';
    ctx.fillRect(x - 25, y - 55, 8, 8);
    ctx.fillRect(x + 15, y - 52, 6, 6);
    ctx.fillRect(x - 10, y - 58, 5, 5);

    // Cannon
    const cDir = this.facing;
    ctx.fillStyle = flash ? C.white : '#4A5A6A';
    ctx.fillRect(x + cDir * 10, y - 42, cDir * 30, 10);
    ctx.fillStyle = C.red;
    ctx.fillRect(x + cDir * 38, y - 44, cDir * 6, 14);

    // Weak point (glowing when vulnerable)
    const isVuln = this.phase === 'vulnerable';
    ctx.fillStyle = isVuln ? '#AAFF66' : C.hvAccent;
    if (isVuln) {
      ctx.globalAlpha = 0.5 + Math.sin(this.animT * 8) * 0.3;
      ctx.beginPath();
      ctx.arc(x, y - 35, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = dying ? Math.max(0, this.deathTimer / 2) : 1;
    }
    ctx.beginPath();
    ctx.arc(x, y - 35, 10, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = this.phase === 'vulnerable' ? '#FFFF00' : C.red;
    ctx.fillRect(x - 4, y - 38, 8, 5);

    // HP bar (above boss)
    if (this.hp > 0) {
      const bw = 70;
      const bh = 6;
      const bx = x - bw / 2;
      const by = y - 66;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      ctx.fillStyle = this.hp > 4 ? '#44AA44' : (this.hp > 2 ? '#DDAA22' : '#DD3333');
      ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
    }

    // Warning telegraph
    if (this.warningTimer > 0) {
      ctx.fillStyle = 'rgba(255,60,30,0.15)';
      if (this._nextAttack === 'charge') {
        const wx = this.facing === 1 ? x : this.arenaLeft;
        const ww = this.facing === 1 ? (this.arenaRight - x) : (x - this.arenaLeft);
        ctx.fillRect(wx, y - 60, ww, 60);
      } else {
        ctx.fillRect(x - 50, y - 100, 100, 100);
      }
    }

    // Projectiles
    this.projectiles.forEach(p => {
      ctx.fillStyle = '#8A6A4A';
      ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
      ctx.fillStyle = '#6A5030';
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    });

    if (dying) ctx.globalAlpha = 1;
  }
}

// Fox Spirit - Post-boss guide NPC
export class FoxSpirit {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.visible = false;
    this.animT = 0;
    this.alpha = 0;
    this.pathPoints = [];
    this.currentPoint = 0;
    this.moving = false;
    this.speed = 100;
    this.arrived = false;
    this.interactable = false;
    this.message = '';
    this.messageTimer = 0;
  }

  appear(engine) {
    this.visible = true;
    this.alpha = 0;
    if (engine.sfx) engine.sfx.foxSpirit();
    engine.flightLog.add('Spirit presence detected...', 'explore');
  }

  setPath(points) {
    this.pathPoints = points;
    this.currentPoint = 0;
    this.moving = true;
  }

  update(dt) {
    if (!this.visible) return;
    this.animT += dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;

    // Fade in
    if (this.alpha < 1) this.alpha = Math.min(1, this.alpha + dt * 2);

    // Follow path
    if (this.moving && this.pathPoints.length > 0) {
      const target = this.pathPoints[this.currentPoint];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        this.currentPoint++;
        if (this.currentPoint >= this.pathPoints.length) {
          this.moving = false;
          this.arrived = true;
          this.interactable = true;
        }
      } else {
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
      }
    }
  }

  showMessage(text) {
    this.message = text;
    this.messageTimer = 4;
  }

  render(ctx) {
    if (!this.visible || this.alpha <= 0) return;

    ctx.globalAlpha = this.alpha * (0.7 + Math.sin(this.animT * 3) * 0.2);
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const bob = Math.sin(this.animT * 2.5) * 4;

    // Glow
    ctx.fillStyle = 'rgba(100,200,255,0.15)';
    ctx.beginPath();
    ctx.arc(x, y + bob - 10, 24, 0, Math.PI * 2);
    ctx.fill();

    // Body (ethereal fox shape)
    ctx.fillStyle = '#88CCFF';
    ctx.beginPath();
    ctx.moveTo(x - 12, y + bob);
    ctx.lineTo(x - 8, y + bob - 16);
    ctx.lineTo(x, y + bob - 22);
    ctx.lineTo(x + 8, y + bob - 16);
    ctx.lineTo(x + 12, y + bob);
    ctx.lineTo(x + 6, y + bob + 6);
    ctx.lineTo(x - 6, y + bob + 6);
    ctx.closePath();
    ctx.fill();

    // Ears
    ctx.fillStyle = '#AADDFF';
    ctx.beginPath();
    ctx.moveTo(x - 6, y + bob - 16);
    ctx.lineTo(x - 10, y + bob - 28);
    ctx.lineTo(x - 2, y + bob - 18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 6, y + bob - 16);
    ctx.lineTo(x + 10, y + bob - 28);
    ctx.lineTo(x + 2, y + bob - 18);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 5, y + bob - 12, 3, 3);
    ctx.fillRect(x + 2, y + bob - 12, 3, 3);

    // Tail
    const tailWag = Math.sin(this.animT * 4) * 8;
    ctx.strokeStyle = '#88CCFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + bob + 4);
    ctx.quadraticCurveTo(x + tailWag, y + bob + 16, x + tailWag * 1.5, y + bob + 10);
    ctx.stroke();

    ctx.globalAlpha = 1;

    // Interact prompt
    if (this.interactable) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(x - 28, y + bob - 42, 56, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Press E', x, y + bob - 30);
    }

    // Message
    if (this.messageTimer > 0) {
      const ma = Math.min(1, this.messageTimer);
      ctx.globalAlpha = ma;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.roundRect(x - 120, y + bob - 60, 240, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#88CCFF';
      ctx.font = '12px "Nunito", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.message, x, y + bob - 43);
      ctx.globalAlpha = 1;
    }
  }
}
