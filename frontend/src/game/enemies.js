import { EN, PL, C } from './constants';
import { sfx } from './sfx';

const GRAVITY = PL.gravity;
const MAX_FALL = PL.maxFall;

// Preload claymation enemy sprite PNGs (generated via Gemini Nano Banana).
// If a sprite fails to load, _drawSprite returns false and the procedural
// canvas drawing fallback is used.
const ENEMY_SPRITES = {};
const SPRITE_FILES = {
  root_crawler: '/enemies/root_crawler.png',
  gear_bug: '/enemies/gear_bug.png',
  heavy: '/enemies/heavy.png',
};
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
      this.deathTimer = 0.4;
      engine.gameState.addScore(this.score);
      engine.gameState.scrapMeter = Math.min(
        engine.gameState.maxScrap,
        engine.gameState.scrapMeter + this.scrapDrop * 8
      );
      engine.addParticles(this.cx, this.cy, 10, this._getColor());
      engine.flightLog.add(`Defeated ${this.type.replace('_', ' ')} [${this.family}]`, 'combat');
      sfx.enemyDeath();
      if (engine.achievements) engine.achievements.onEnemyKilled();
    }
  }

  takePercentDamage(percent, fromX, engine) {
    const dmg = Math.max(1, Math.ceil(this.maxHp * percent));
    this.takeDamage(dmg, fromX, engine, { bypassArmor: true, bypassFlicker: true });
  }

  _getColor() { return C.white; }

  render(ctx) {
    if (!this.alive) {
      if (this.deathTimer > 0) {
        ctx.globalAlpha = this.deathTimer / 0.4;
        if (!this._drawSprite(ctx)) this._draw(ctx);
        ctx.globalAlpha = 1;
      }
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
    if (!this._drawSprite(ctx)) this._draw(ctx);
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

export function createEnemy(data) {
  switch (data.type) {
    case 'root_crawler': return new RootCrawler(data.x, data.y);
    case 'gear_bug': return new GearBug(data.x, data.y);
    case 'flicker': return new FlickerEnemy(data.x, data.y);
    case 'heavy': return new HeavyEnemy(data.x, data.y);
    default: return new RootCrawler(data.x, data.y);
  }
}
