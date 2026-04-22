import { EN, PL, C } from './constants';
import { sfx } from './sfx';

const GRAVITY = PL.gravity;
const MAX_FALL = PL.maxFall;

// Enemy PNG sprites disabled — using procedural pixel-rect rendering instead.
// To re-enable, repopulate SPRITE_FILES below.
const ENEMY_SPRITES = {};
const SPRITE_FILES = {};
if (typeof window !== 'undefined') {
  Object.entries(SPRITE_FILES).forEach(([k, src]) => {
    const img = new Image();
    img.onload = () => { img._ready = true; };
    img.src = src;
    ENEMY_SPRITES[k] = img;
  });
}

class EnemyBase {
  constructor(x, y, type) {
    const cfg = EN[type];
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.w = cfg.w; this.h = cfg.h;
    this.hp = cfg.hp; this.maxHp = cfg.hp;
    this.speed = cfg.spd; this.dmg = cfg.dmg;
    this.patrol = cfg.patrol; this.score = cfg.score;
    this.scrapDrop = cfg.scrap;
    this.type = type;
    this.family = cfg.family || 'machine';
    this.sizeClass = cfg.sizeClass || 'weak';
    this.armored = !!cfg.armored;
    this.hasFlicker = !!cfg.flicker;
    this.flickerOpen = true;
    this.flickerT = 0.95;
    this.originX = x;
    this.dir = 1;
    this.state = 'patrol';
    this.alive = true;
    this.grounded = false;
    this.hurtTimer = 0;
    this.flashTimer = 0;
    this.animT = 0;
    this.deathTimer = 0;
  }

  isWeak()  { return this.sizeClass === 'weak'; }
  isLarge() { return this.sizeClass === 'large'; }

  get left() { return this.x - this.w / 2; }
  get right() { return this.x + this.w / 2; }
  get top() { return this.y - this.h; }
  get bottom() { return this.y; }
  get cx() { return this.x; }
  get cy() { return this.y - this.h / 2; }

  getHitbox() { return { x: this.left, y: this.top, w: this.w, h: this.h }; }

  update(dt, engine) {
    if (!this.alive) {
      this.deathTimer -= dt;
      return;
    }
    this.animT += dt;
    if (this.hurtTimer > 0) { this.hurtTimer -= dt; return; }
    if (this.flashTimer > 0) this.flashTimer -= dt;

    this._ai(dt, engine);
    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this._resolveGround(engine);
  }

  _ai(dt, engine) {
    const px = engine.player.x;
    const dist = Math.abs(px - this.x);

    if (this.state === 'patrol') {
      this.vx = this.dir * this.speed;
      // Wall bounce
      if (Math.abs(this.x - this.originX) > this.patrol) {
        this.dir *= -1;
      }
      // Ledge detection — check if there's ground ahead
      if (this.grounded) {
        const checkX = this.x + this.dir * (this.w / 2 + 8);
        const checkY = this.y + 10;
        let hasFloor = false;
        for (const p of engine.platforms) {
          if (checkX >= p.x && checkX <= p.x + p.w && checkY >= p.y && checkY <= p.y + p.h + 10) {
            hasFloor = true;
            break;
          }
        }
        if (!hasFloor) {
          this.dir *= -1;
          this.originX = this.x; // Reset patrol center
        }
      }
      if (dist < 200 && this.type !== 'heavy') {
        this.state = 'chase';
      }
    } else if (this.state === 'chase') {
      const toPlayer = px > this.x ? 1 : -1;
      // Ledge check while chasing — don't run off ledges
      if (this.grounded) {
        const checkX = this.x + toPlayer * (this.w / 2 + 8);
        const checkY = this.y + 10;
        let hasFloor = false;
        for (const p of engine.platforms) {
          if (checkX >= p.x && checkX <= p.x + p.w && checkY >= p.y && checkY <= p.y + p.h + 10) {
            hasFloor = true;
            break;
          }
        }
        if (!hasFloor) {
          // Stop at ledge instead of falling
          this.vx = 0;
          this.dir = -toPlayer;
          this.state = 'patrol';
          this.originX = this.x;
          return;
        }
      }
      this.dir = toPlayer;
      this.vx = toPlayer * this.speed * 1.3;
      if (dist > 300) this.state = 'patrol';
    }
  }

  _resolveGround(engine) {
    this.grounded = false;
    for (const p of engine.platforms) {
      if (this.right <= p.x || this.left >= p.x + p.w) continue;
      // Only land if the enemy's feet were above the platform top in the previous frame
      // (prev bottom) or within a small tolerance — avoids snapping onto platform sides
      if (this.vy >= 0 && this.bottom > p.y && this.bottom <= p.y + 8) {
        this.y = p.y;
        this.vy = 0;
        this.grounded = true;
      }
    }
  }

  takeDamage(amount, fromX, engine, opts = {}) {
    // Flicker invuln: must be "open" (blink window) unless opts.percent bypass
    if (this.hasFlicker && !this.flickerOpen && !opts.bypassFlicker) {
      engine.gameState.showPickup('Flicker shell sealed!');
      return;
    }
    // Heavy armor: requires empowered attack (Golden Gloves / Burning Buffalo) or smash or assist
    if (this.armored && !opts.bypassArmor) {
      const pm = engine.powerManager;
      const empowered = pm.isGoldenGloves || pm.isBurningBuffalo || opts.smash;
      if (!empowered) {
        engine.gameState.showPickup('Heavy shell shrugged it off!');
        return;
      }
      amount += 1; // bonus damage when empowered
    }
    this.hp -= amount;
    this.hurtTimer = 0.12;
    this.flashTimer = 0.12;
    this.vx = (this.x > fromX ? 1 : -1) * 150;
    this.vy = -100;
    engine.hitStopTimer = 0.04;
    engine.addParticles(this.cx, this.cy, 4, C.white);
    sfx.enemyHit();
    if (this.hp <= 0) {
      this.alive = false;
      this.deathTimer = 0.55;           // slightly longer so smoke plays out
      engine.gameState.addScore(this.score);
      engine.gameState.scrapMeter = Math.min(
        engine.gameState.maxScrap,
        engine.gameState.scrapMeter + this.scrapDrop * 8
      );
      // POOF! — spawn a ring of smoke puffs instead of the old fade-sprite.
      this._spawnSmokePoof(engine);
      engine.flightLog.add(`Defeated ${this.type.replace('_', ' ')} [${this.family}]`, 'combat');
      sfx.enemyDeath();
      if (engine.achievements) engine.achievements.onEnemyKilled();
    }
  }

  _spawnSmokePoof(engine) {
    // Enemy "poofs" into smoke on death: white/grey particle ring that rises.
    // Lives on engine.particles (already rendered each frame).
    const cx = this.cx, cy = this.cy;
    const sizeMul = this.sizeClass === 'large' ? 1.5 : 1.0;
    const count = 14;
    const tones = ['#E8E8E8', '#CFCFCF', '#B5B5B5', '#9C9C9C'];
    const smokeRender = function (ctx) {
      const a = Math.max(0, this.life / this.maxLife);
      ctx.globalAlpha = a * 0.75;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };
    const smokeUpdate = function (dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.92;
      this.vy *= 0.94;
      this.vy -= 55 * dt;
      this.r += 20 * dt;
      this.life -= dt;
    };
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const spd = (40 + Math.random() * 60) * sizeMul;
      engine.particles.push({
        x: cx + Math.cos(ang) * 4,
        y: cy + Math.sin(ang) * 4,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 60,
        r: (8 + Math.random() * 8) * sizeMul,
        life: 0.55, maxLife: 0.55,
        color: tones[i % tones.length],
        update: smokeUpdate, render: smokeRender,
      });
    }
    engine.particles.push({
      x: cx, y: cy, vx: 0, vy: 0,
      r: 22 * sizeMul, life: 0.12, maxLife: 0.12,
      color: '#FFFFFF',
      update(dt) { this.r += 120 * dt; this.life -= dt; },
      render: smokeRender,
    });
  }

  takePercentDamage(percent, fromX, engine) {
    const dmg = Math.max(1, Math.ceil(this.maxHp * percent));
    this.takeDamage(dmg, fromX, engine, { bypassArmor: true, bypassFlicker: true });
  }

  _getColor() { return C.white; }

  render(ctx) {
    if (!this.alive) {
      // Don't re-draw the body on death — the smoke particle burst replaces it.
      return;
    }
    // Flicker: dim when sealed/closed
    let savedAlpha = 1;
    if (this.hasFlicker && !this.flickerOpen) {
      savedAlpha = ctx.globalAlpha;
      ctx.globalAlpha = savedAlpha * 0.32;
    }
    if (this.flashTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
    }
    // Biome tint overlay — drawn as composited color wash
    if (this.tintColor) {
      ctx.save();
      if (!this._drawSprite(ctx)) this._draw(ctx);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = this.tintColor;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(this.x - this.w, this.y - this.h * 1.6, this.w * 2.2, this.h * 1.8);
      ctx.restore();
    } else {
      if (!this._drawSprite(ctx)) this._draw(ctx);
    }
    if (this.flashTimer > 0) ctx.restore();
    if (this.hasFlicker && !this.flickerOpen) {
      ctx.globalAlpha = savedAlpha;
    }
  }

  _draw(ctx) {}

  _drawSprite(ctx) {
    const img = ENEMY_SPRITES[this.type];
    if (!img || !img._ready) return false;
    const drawW = this.w * 1.45;
    const drawH = this.h * 1.6;
    const sx = Math.round(this.x - drawW / 2);
    const sy = Math.round(this.y - drawH);
    ctx.save();
    if (this.dir < 0) {
      ctx.translate(this.x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-this.x, 0);
    }
    // Bob micro-animation
    const bob = Math.sin(this.animT * 4) * 1.2;
    ctx.drawImage(img, sx, Math.round(sy + bob), Math.round(drawW), Math.round(drawH));
    ctx.restore();
    return true;
  }
}

export class RootCrawler extends EnemyBase {
  constructor(x, y) { super(x, y, 'root_crawler'); }
  _getColor() { return C.rcBody; }
  _draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y);
    const f = this.dir;
    // Body
    ctx.fillStyle = this.flashTimer > 0 ? C.white : C.rcBody;
    ctx.beginPath();
    ctx.moveTo(x - 17*f, y - 8); ctx.lineTo(x - 12*f, y - 17);
    ctx.lineTo(x + 2*f, y - 19); ctx.lineTo(x + 16*f, y - 13);
    ctx.lineTo(x + 22*f, y - 2); ctx.lineTo(x + 18*f, y + 0);
    ctx.lineTo(x + 3*f, y + 2); ctx.lineTo(x - 14*f, y + 0);
    ctx.closePath(); ctx.fill();
    // Belly
    ctx.fillStyle = C.rcBelly;
    ctx.fillRect(x - 10, y - 4, 20, 4);
    // Eye
    ctx.fillStyle = C.rcEye;
    ctx.fillRect(x + 4*f, y - 14, 7, 6);
    // Legs bob
    const bob = Math.sin(this.animT * 12) * 2;
    ctx.fillStyle = C.rcBody;
    ctx.fillRect(x - 12, y, 4, 4 + bob);
    ctx.fillRect(x + 8, y, 4, 4 - bob);
  }
}

export class GearBug extends EnemyBase {
  constructor(x, y) { super(x, y, 'gear_bug'); }
  _getColor() { return C.gbBody; }
  _draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y);
    ctx.fillStyle = this.flashTimer > 0 ? C.white : C.gbBody;
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 10); ctx.lineTo(x - 8, y - 16);
    ctx.lineTo(x + 8, y - 16); ctx.lineTo(x + 15, y - 8);
    ctx.lineTo(x + 15, y + 0); ctx.lineTo(x + 8, y + 4);
    ctx.lineTo(x - 10, y + 4); ctx.lineTo(x - 15, y - 3);
    ctx.closePath(); ctx.fill();
    // Inner gear
    ctx.fillStyle = C.gbInner;
    const rot = this.animT * 3;
    ctx.save();
    ctx.translate(x, y - 6);
    ctx.rotate(rot);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-2, -8, 4, 5);
    }
    ctx.restore();
    // Legs
    const bob = Math.sin(this.animT * 14) * 2;
    ctx.fillStyle = C.gbBody;
    ctx.fillRect(x - 10, y + 4, 3, 4 + bob);
    ctx.fillRect(x, y + 4, 3, 4 - bob);
    ctx.fillRect(x + 8, y + 4, 3, 4 + bob);
  }
}

export class FlickerEnemy extends EnemyBase {
  constructor(x, y) {
    super(x, y, 'flicker');
    this.baseY = y;
  }
  _getColor() { return C.flBody; }
  // Flicker floats — override update to skip gravity and stay airborne
  update(dt, engine) {
    if (!this.alive) {
      this.deathTimer -= dt;
      return;
    }
    this.animT += dt;
    // Blink cycle — toggle every 0.95s
    this.flickerT -= dt;
    if (this.flickerT <= 0) {
      this.flickerT = 0.95;
      this.flickerOpen = !this.flickerOpen;
    }
    if (this.hurtTimer > 0) { this.hurtTimer -= dt; return; }
    if (this.flashTimer > 0) this.flashTimer -= dt;

    this._ai(dt, engine);
    // Bob vertically around baseY; no gravity
    const targetY = this.baseY + Math.sin(this.animT * 2.2) * 14;
    this.y += (targetY - this.y) * Math.min(1, dt * 6);
    this.vy = 0;
    this.x += this.vx * dt;
  }
  _ai(dt, engine) {
    // Horizontal patrol/chase only (gravity-free)
    const px = engine.player.x;
    const dist = Math.abs(px - this.x);
    if (this.state === 'patrol') {
      this.vx = this.dir * this.speed;
      if (Math.abs(this.x - this.originX) > this.patrol) this.dir *= -1;
      if (dist < 220) this.state = 'chase';
    } else {
      const toPlayer = px > this.x ? 1 : -1;
      this.dir = toPlayer;
      this.vx = toPlayer * this.speed * 1.2;
      // Slow vertical drift toward player too
      this.baseY += ((engine.player.cy) - this.baseY) * Math.min(1, dt * 0.5);
      if (dist > 320) this.state = 'patrol';
    }
  }
  _draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y);
    const glow = 0.3 + Math.sin(this.animT * 6) * 0.2;
    ctx.fillStyle = this.flashTimer > 0 ? C.white : C.flBody;
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 10); ctx.lineTo(x - 8, y - 18);
    ctx.lineTo(x + 8, y - 18); ctx.lineTo(x + 16, y - 8);
    ctx.lineTo(x + 14, y + 2); ctx.lineTo(x - 10, y + 4);
    ctx.closePath(); ctx.fill();
    // Glow
    ctx.globalAlpha = glow;
    ctx.fillStyle = C.flGlow;
    ctx.beginPath();
    ctx.arc(x, y - 8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Eye
    ctx.fillStyle = C.white;
    ctx.fillRect(x - 4, y - 14, 8, 6);
    ctx.fillStyle = C.flBody;
    ctx.fillRect(x - 2, y - 12, 4, 4);
  }
}

export class HeavyEnemy extends EnemyBase {
  constructor(x, y) { super(x, y, 'heavy'); }
  _getColor() { return C.hvBody; }
  _draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y);
    ctx.fillStyle = this.flashTimer > 0 ? C.white : C.hvBody;
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 16); ctx.lineTo(x - 8, y - 20);
    ctx.lineTo(x + 10, y - 20); ctx.lineTo(x + 20, y - 14);
    ctx.lineTo(x + 24, y - 2); ctx.lineTo(x + 20, y + 8);
    ctx.lineTo(x + 8, y + 10); ctx.lineTo(x - 10, y + 10);
    ctx.lineTo(x - 20, y + 8); ctx.lineTo(x - 24, y - 2);
    ctx.closePath(); ctx.fill();
    // Accent plate (weak point)
    ctx.fillStyle = this.flashTimer > 0 ? C.yellow : C.hvAccent;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 10); ctx.lineTo(x + 10, y - 10);
    ctx.lineTo(x + 14, y - 2); ctx.lineTo(x + 10, y + 6);
    ctx.lineTo(x - 10, y + 6); ctx.lineTo(x - 14, y - 2);
    ctx.closePath(); ctx.fill();
    // Warning eye
    ctx.fillStyle = C.red;
    ctx.fillRect(x - 3, y - 8, 6, 4);
    // Treads
    ctx.fillStyle = C.hvPlate;
    ctx.fillRect(x - 18, y + 10, 10, 6);
    ctx.fillRect(x + 8, y + 10, 10, 6);
  }
}

/* ─────────────────────────────────────────────────────────────
   Minor enemy roster — varied sizes (3ft / 5ft / 6ft)
   Styled after the user's claymation reference art.
   ───────────────────────────────────────────────────────────── */

// 3ft Wispling — tiny float-ghost. Hovers, ignores gravity, bobs toward Axel.
export class Wispling extends EnemyBase {
  constructor(x, y) {
    super(x, y, 'wispling');
    this.hoverY = y;
  }
  _getColor() { return C.wpBody; }
  update(dt, engine) {
    if (!this.alive) { this.deathTimer -= dt; return; }
    this.animT += dt;
    if (this.hurtTimer > 0) { this.hurtTimer -= dt; return; }
    if (this.flashTimer > 0) this.flashTimer -= dt;
    // Zero gravity — bob in place and drift.
    this.vy = Math.sin(this.animT * 3) * 18;
    const pl = engine.player;
    if (pl && Math.abs(pl.x - this.x) < 260) {
      this.dir = pl.x > this.x ? 1 : -1;
      this.vx = this.dir * 90;
    } else {
      this.vx = this.dir * 40;
      if (Math.abs(this.x - this.originX) > this.patrol) this.dir *= -1;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
  _draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y);
    const bob = Math.sin(this.animT * 4) * 2;
    // Ghostly body
    ctx.fillStyle = this.flashTimer > 0 ? C.white : C.wpBody;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 8 + bob);
    ctx.quadraticCurveTo(x, y - 20 + bob, x + 10, y - 8 + bob);
    ctx.lineTo(x + 10, y + 2 + bob);
    // scalloped tail
    for (let i = 0; i < 3; i++) {
      ctx.quadraticCurveTo(x + 7 - i * 7, y + 6 + bob, x + 4 - i * 7, y + 2 + bob);
    }
    ctx.closePath(); ctx.fill();
    // Shade
    ctx.fillStyle = C.wpShade;
    ctx.fillRect(x - 9, y - 4 + bob, 18, 2);
    // Eyes (blue flame dots)
    ctx.fillStyle = C.wpEye;
    ctx.fillRect(x - 5, y - 13 + bob, 3, 4);
    ctx.fillRect(x + 2, y - 13 + bob, 3, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 4, y - 12 + bob, 1, 1);
    ctx.fillRect(x + 3, y - 12 + bob, 1, 1);
  }
}

// 5ft Candle Skull — skull with flame hat; patrols and tosses small flame sparks.
export class CandleSkull extends EnemyBase {
  constructor(x, y) {
    super(x, y, 'candle_skull');
    this.sparkT = 2.0;
  }
  _getColor() { return C.csFlame; }
  _ai(dt, engine) {
    // Standard patrol + occasional flame sparks toward the player.
    if (!this.grounded) return;
    const pl = engine.player;
    const targeting = pl && Math.abs(pl.x - this.x) < 220;
    this.dir = targeting ? (pl.x > this.x ? 1 : -1)
                         : (Math.abs(this.x - this.originX) > this.patrol ? -this.dir : this.dir);
    this.vx = this.dir * this.spd;
    this.sparkT -= dt;
    if (this.sparkT <= 0 && targeting) {
      this.sparkT = 1.8;
      // Spark particle thrown toward the player.
      const ang = Math.atan2((pl.cy) - (this.y - this.h), pl.x - this.x);
      const spd = 180;
      const sparkRender = function (ctx) {
        const a = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = a;
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.round(this.x - 3), Math.round(this.y - 3), 6, 6);
        ctx.globalAlpha = 1;
      };
      engine.particles.push({
        x: this.x + this.dir * 10,
        y: this.y - this.h + 4,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.9, maxLife: 0.9,
        color: C.csFlame,
        update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vy += 220 * dt; this.life -= dt; },
        render: sparkRender,
      });
    }
  }
  _draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y);
    const f = this.dir;
    // Skull
    ctx.fillStyle = this.flashTimer > 0 ? C.white : C.csBone;
    ctx.fillRect(x - 12, y - 28, 24, 22);
    ctx.fillRect(x - 10, y - 30, 20, 2);
    // Jaw
    ctx.fillRect(x - 10, y - 8, 20, 8);
    ctx.fillStyle = C.csShade;
    ctx.fillRect(x - 10, y - 10, 20, 2);
    // Eye sockets
    ctx.fillStyle = '#2A1F1A';
    ctx.fillRect(x - 8, y - 24, 6, 7);
    ctx.fillRect(x + 2, y - 24, 6, 7);
    // Teeth
    ctx.fillStyle = C.csShade;
    for (let i = 0; i < 5; i++) ctx.fillRect(x - 9 + i * 4, y - 4, 2, 3);
    // Flame hat (wobbles)
    const flick = Math.sin(this.animT * 10) * 2;
    ctx.fillStyle = C.csFlame;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 30);
    ctx.lineTo(x - 4 + flick, y - 42);
    ctx.lineTo(x + 1 + flick, y - 38);
    ctx.lineTo(x + 5 + flick, y - 46);
    ctx.lineTo(x + 7, y - 30);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.csFlameHi;
    ctx.fillRect(x - 2 + flick, y - 40, 3, 6);
    // facing tilt dot
    ctx.fillStyle = '#2A1F1A';
    ctx.fillRect(x + f * 4, y - 20, 2, 2);
  }
}

// 6ft Moss Golem — slow hulking tank with a ground-pound shockwave attack.
export class MossGolem extends EnemyBase {
  constructor(x, y) {
    super(x, y, 'moss_golem');
    this.poundT = 3.5;
    this.pounding = false;
  }
  _getColor() { return C.mgBody; }
  _ai(dt, engine) {
    if (!this.grounded) return;
    // Walks slowly toward the player within range.
    const pl = engine.player;
    const targeting = pl && Math.abs(pl.x - this.x) < 340;
    if (this.pounding) { this.vx = 0; return; }
    this.dir = targeting ? (pl.x > this.x ? 1 : -1)
                         : (Math.abs(this.x - this.originX) > this.patrol ? -this.dir : this.dir);
    this.vx = this.dir * this.spd;
    // Ground pound — telegraphed pause then shockwave.
    this.poundT -= dt;
    if (this.poundT <= 0 && targeting && Math.abs(pl.x - this.x) < 120) {
      this.poundT = 3.6;
      this.pounding = true;
      this.vx = 0;
      // 0.6s windup, then fire two shockwave "rocks" along the ground.
      setTimeout(() => {
        if (!this.alive) { this.pounding = false; return; }
        this.pounding = false;
        engine.camera.shake(6, 0.2);
        const rockRender = function (ctx) {
          ctx.fillStyle = this.color;
          ctx.fillRect(Math.round(this.x - 5), Math.round(this.y - 6), 10, 8);
          ctx.fillStyle = '#1F361A';
          ctx.fillRect(Math.round(this.x - 3), Math.round(this.y - 4), 2, 2);
        };
        [-1, 1].forEach(dx => {
          engine.particles.push({
            x: this.x + dx * 20,
            y: this.y - 4,
            vx: dx * 220, vy: -40,
            life: 1.1, maxLife: 1.1,
            color: C.mgMoss,
            update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vy += 800 * dt; this.life -= dt; },
            render: rockRender,
            damage: this.dmg,
            radius: 12,
          });
        });
      }, 600);
    }
  }
  _draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y);
    // Body (squat)
    ctx.fillStyle = this.flashTimer > 0 ? C.white : (this.pounding ? C.mgMoss : C.mgBody);
    ctx.fillRect(x - 22, y - 40, 44, 32);
    // Head
    ctx.fillStyle = C.mgBody;
    ctx.fillRect(x - 16, y - 52, 32, 14);
    // Moss tufts on shoulders & top
    ctx.fillStyle = C.mgMoss;
    ctx.fillRect(x - 22, y - 44, 44, 4);
    ctx.fillRect(x - 20, y - 54, 6, 4);
    ctx.fillRect(x + 14, y - 54, 6, 4);
    ctx.fillRect(x - 6, y - 55, 12, 3);
    // Shade underside
    ctx.fillStyle = C.mgShade;
    ctx.fillRect(x - 22, y - 10, 44, 4);
    // Glowing eye
    ctx.fillStyle = this.pounding ? '#FF7D3B' : C.mgEye;
    ctx.fillRect(x - 5, y - 46, 10, 5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 3, y - 45, 2, 2);
    // Arms (long, slab-like)
    ctx.fillStyle = C.mgBody;
    ctx.fillRect(x - 28, y - 34, 6, 22);
    ctx.fillRect(x + 22, y - 34, 6, 22);
    // Legs
    ctx.fillStyle = C.mgShade;
    ctx.fillRect(x - 16, y - 8, 10, 8);
    ctx.fillRect(x + 6, y - 8, 10, 8);
    // Windup shake ring
    if (this.pounding) {
      ctx.strokeStyle = 'rgba(247,215,95,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 2, 22 + Math.sin(this.animT * 20) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function createEnemy(data) {
  switch (data.type) {
    case 'root_crawler': return new RootCrawler(data.x, data.y);
    case 'gear_bug':     return new GearBug(data.x, data.y);
    case 'flicker':      return new FlickerEnemy(data.x, data.y);
    case 'heavy':        return new HeavyEnemy(data.x, data.y);
    case 'wispling':     return new Wispling(data.x, data.y);
    case 'candle_skull': return new CandleSkull(data.x, data.y);
    case 'moss_golem':   return new MossGolem(data.x, data.y);
    default:             return new RootCrawler(data.x, data.y);
  }
}
