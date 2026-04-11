import { EN, GRAVITY, MAX_FALL, C } from './constants';

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
    this.originX = x;
    this.dir = 1;
    this.state = 'patrol';
    this.alive = true;
    this.hurtTimer = 0;
    this.flashTimer = 0;
    this.animT = 0;
    this.deathTimer = 0;
  }

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
      if (Math.abs(this.x - this.originX) > this.patrol) {
        this.dir *= -1;
      }
      if (dist < 200 && this.type !== 'heavy') {
        this.state = 'chase';
      }
    } else if (this.state === 'chase') {
      const toPlayer = px > this.x ? 1 : -1;
      this.dir = toPlayer;
      this.vx = toPlayer * this.speed * 1.3;
      if (dist > 300) this.state = 'patrol';
    }
  }

  _resolveGround(engine) {
    for (const p of engine.platforms) {
      if (this.right <= p.x || this.left >= p.x + p.w) continue;
      if (this.bottom > p.y && this.bottom < p.y + p.h + 10 && this.vy >= 0) {
        this.y = p.y;
        this.vy = 0;
      }
    }
  }

  takeDamage(amount, fromX, engine) {
    this.hp -= amount;
    this.hurtTimer = 0.12;
    this.flashTimer = 0.12;
    this.vx = (this.x > fromX ? 1 : -1) * 150;
    this.vy = -100;
    engine.hitStopTimer = 0.04;
    engine.addParticles(this.cx, this.cy, 4, C.white);
    if (this.hp <= 0) {
      this.alive = false;
      this.deathTimer = 0.4;
      engine.gameState.addScore(this.score);
      engine.gameState.scrapMeter = Math.min(
        engine.gameState.maxScrap,
        engine.gameState.scrapMeter + this.scrapDrop * 8
      );
      engine.addParticles(this.cx, this.cy, 10, this._getColor());
      engine.flightLog.add(`Defeated ${this.type.replace('_', ' ')}`, 'combat');
    }
  }

  _getColor() { return C.white; }

  render(ctx) {
    if (!this.alive) {
      if (this.deathTimer > 0) {
        ctx.globalAlpha = this.deathTimer / 0.4;
        this._draw(ctx);
        ctx.globalAlpha = 1;
      }
      return;
    }
    if (this.flashTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
    }
    this._draw(ctx);
    if (this.flashTimer > 0) ctx.restore();
  }

  _draw(ctx) {}
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
  constructor(x, y) { super(x, y, 'flicker'); }
  _getColor() { return C.flBody; }
  _ai(dt, engine) {
    // Flicker floats and bobs, less aggressive patrol
    this.vy = Math.sin(this.animT * 3) * 30 - GRAVITY * dt;
    super._ai(dt, engine);
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
