import { C } from './constants';
import { sfx } from './sfx';

class PickupBase {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.type = type;
    this.w = 16; this.h = 16;
    this.collected = false;
    this.bobT = Math.random() * Math.PI * 2;
  }

  get hitbox() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  update(dt) { this.bobT += dt * 3; }

  collect(engine) { this.collected = true; }

  render(ctx) {
    if (this.collected) return;
    const bob = Math.sin(this.bobT) * 3;
    this._draw(ctx, Math.round(this.x), Math.round(this.y + bob));
  }

  _draw(ctx, x, y) {}
}

export class CoinPickup extends PickupBase {
  constructor(x, y) { super(x, y, 'coin'); }

  collect(engine) {
    super.collect(engine);
    engine.gameState.addCoin();
    sfx.coinPickup();
  }

  _draw(ctx, x, y) {
    ctx.fillStyle = C.coin;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.coinShine;
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#C4A830';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export class ScrapPickup extends PickupBase {
  constructor(x, y) { super(x, y, 'scrap'); }

  collect(engine) {
    super.collect(engine);
    engine.gameState.addScrap();
    sfx.scrapPickup();
  }

  _draw(ctx, x, y) {
    ctx.fillStyle = C.scrapC;
    ctx.fillRect(x - 7, y - 5, 14, 10);
    ctx.fillStyle = C.scrapDk;
    ctx.fillRect(x - 4, y - 7, 8, 3);
    ctx.fillRect(x - 3, y + 5, 6, 3);
    // Bolt detail
    ctx.fillStyle = C.white;
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
}

export class FoodPickup extends PickupBase {
  constructor(x, y) { super(x, y, 'food'); }

  collect(engine) {
    super.collect(engine);
    engine.gameState.addFood();
    sfx.foodPickup();
  }

  _draw(ctx, x, y) {
    // Apple
    ctx.fillStyle = C.food;
    ctx.beginPath();
    ctx.arc(x, y + 1, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.foodStem;
    ctx.fillRect(x - 1, y - 10, 2, 6);
    // Leaf
    ctx.fillStyle = C.food;
    ctx.fillRect(x + 1, y - 9, 5, 3);
  }
}

export class PowerPickup extends PickupBase {
  constructor(x, y, powerId) {
    super(x, y, 'power');
    this.powerId = powerId;
    this.w = 20; this.h = 20;
  }

  collect(engine) {
    super.collect(engine);
    engine.powerManager.activate(this.powerId);
    engine.gameState.showPickup(`Power: ${this.powerId.replace('_', ' ').toUpperCase()}`);
    engine.flightLog.add(`Activated ${this.powerId.replace('_', ' ')}`, 'power');
    sfx.powerPickup();
  }

  _draw(ctx, x, y) {
    const colors = {
      burning_buffalo: C.red, shadow_tag: '#8B5CF6',
      golden_gloves: C.yellow, super_mode: '#FF4444',
      specter_mode: '#88DDFF', fighter_plane: '#44BB44',
    };
    const col = colors[this.powerId] || C.teal;
    // Glow
    ctx.globalAlpha = 0.3 + Math.sin(this.bobT * 2) * 0.15;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Core
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    // Border
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();
    // Letter
    ctx.fillStyle = C.white;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const letters = {
      burning_buffalo: 'B', shadow_tag: 'S', golden_gloves: 'G',
      super_mode: 'M', specter_mode: 'P', fighter_plane: 'F',
    };
    ctx.fillText(letters[this.powerId] || '?', x, y + 1);
  }
}

export class Breakable {
  constructor(x, y, w, h, btype, smashOnly = false) {
    this.x = x; this.y = y;
    this.w = w; this.h = h;
    this.btype = btype; // 'wall' or 'floor'
    this.smashOnly = smashOnly;
    this.hp = smashOnly ? 1 : 2;
    this.broken = false;
    this.breakTimer = 0;
    this.crackLevel = 0;
  }

  get platform() {
    if (this.broken) return null;
    return { x: this.x, y: this.y, w: this.w, h: this.h, breakable: this };
  }

  hit(amount, isSmash, engine) {
    if (this.broken) return false;
    if (this.smashOnly && !isSmash && !engine.powerManager.isBurningBuffalo) return false;
    this.hp -= amount;
    this.crackLevel++;
    engine.camera.shake(5, 0.12);
    engine.addParticles(this.x + this.w / 2, this.y + this.h / 2, 6,
      this.btype === 'wall' ? C.brkWall : C.brkFloor);
    if (this.hp <= 0) {
      this.broken = true;
      this.breakTimer = 0.5;
      engine.addParticles(this.x + this.w / 2, this.y + this.h / 2, 12,
        this.btype === 'wall' ? C.brkWall : C.brkFloor);
      engine.flightLog.add(`Broke through ${this.btype}`, 'explore');
      sfx.breakWall();
      return true;
    }
    return false;
  }

  update(dt) {
    if (this.broken && this.breakTimer > 0) this.breakTimer -= dt;
  }

  render(ctx) {
    if (this.broken) {
      if (this.breakTimer > 0) {
        ctx.globalAlpha = this.breakTimer / 0.5;
        this._draw(ctx, true);
        ctx.globalAlpha = 1;
      }
      return;
    }
    this._draw(ctx, false);
  }

  _draw(ctx, breaking) {
    const col = this.btype === 'wall' ? C.brkWall : C.brkFloor;
    ctx.fillStyle = col;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    // Cracks
    if (this.crackLevel > 0 || breaking) {
      ctx.strokeStyle = C.brkCrack;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x + this.w * 0.3, this.y);
      ctx.lineTo(this.x + this.w * 0.5, this.y + this.h * 0.5);
      ctx.lineTo(this.x + this.w * 0.7, this.y + this.h);
      ctx.stroke();
      if (this.crackLevel > 1 || breaking) {
        ctx.beginPath();
        ctx.moveTo(this.x + this.w * 0.6, this.y);
        ctx.lineTo(this.x + this.w * 0.4, this.y + this.h * 0.7);
        ctx.stroke();
      }
    }
    // Hint glow for smash-only
    if (this.smashOnly && !this.broken) {
      ctx.fillStyle = 'rgba(245,199,133,0.2)';
      ctx.fillRect(this.x - 2, this.y - 2, this.w + 4, this.h + 4);
    }
  }
}

export class FoxStatuePickup extends PickupBase {
  constructor(x, y) {
    super(x, y, 'foxstatue');
    this.w = 40; this.h = 56;
    this.used = false;
    this.glowT = 0;
  }
  get hitbox() {
    return { x: this.x - 24, y: this.y - 56, w: 48, h: 64 };
  }
  update(dt) {
    this.bobT += dt * 2;
    this.glowT += dt;
  }
  // Override — Fox Statue only activates on E interact, not contact
  collect(engine) {
    if (this.used) return;
    this.used = true;
    this.collected = true;
    engine.gameState.healSticker();
    engine.gameState.healSticker();
    engine.gameState.showPickup('Fox Statue restored your strength');
    engine.flightLog.add('Fox Statue: +2 stickers restored', 'spirit');
    engine.camera.shake(4, 0.2);
    engine.addParticles(this.x, this.y - 24, 20, '#88CCFF');
    sfx.powerPickup();
  }
  render(ctx) {
    if (this.collected && !this.used) return;
    const x = Math.round(this.x), y = Math.round(this.y);
    // Glow (only while active)
    if (!this.used) {
      const pulse = 0.3 + Math.sin(this.glowT * 2) * 0.15;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#88CCFF';
      ctx.beginPath();
      ctx.arc(x, y - 28, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Pedestal
    ctx.fillStyle = '#3A3040';
    ctx.fillRect(x - 20, y - 10, 40, 10);
    ctx.strokeStyle = '#0A0A0A';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 20, y - 10, 40, 10);
    // Statue body
    ctx.fillStyle = this.used ? '#6A6080' : '#B8AAC8';
    ctx.fillRect(x - 12, y - 42, 24, 32);
    // Fox head (stylized triangle ears)
    ctx.fillStyle = this.used ? '#7A7090' : '#C8BAD8';
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 42);
    ctx.lineTo(x - 8, y - 54);
    ctx.lineTo(x - 2, y - 44);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 2, y - 44);
    ctx.lineTo(x + 8, y - 54);
    ctx.lineTo(x + 14, y - 42);
    ctx.closePath();
    ctx.fill();
    // Face
    ctx.fillStyle = this.used ? '#6A6080' : '#B8AAC8';
    ctx.fillRect(x - 10, y - 42, 20, 10);
    // Eyes (glow if active)
    ctx.fillStyle = this.used ? '#3A3040' : '#88CCFF';
    ctx.fillRect(x - 6, y - 38, 3, 3);
    ctx.fillRect(x + 3, y - 38, 3, 3);
    // Outline
    ctx.strokeStyle = '#0A0A0A';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 12, y - 42, 24, 32);
    // Interact prompt
    if (!this.used) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(x - 22, y - 74, 44, 16, 6);
      ctx.fill();
      ctx.fillStyle = '#88CCFF';
      ctx.font = 'bold 10px "Nunito", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[E] HEAL', x, y - 62);
    }
  }
}

export function createPickup(data) {
  switch (data.type) {
    case 'coin': return new CoinPickup(data.x, data.y);
    case 'scrap': return new ScrapPickup(data.x, data.y);
    case 'food': return new FoodPickup(data.x, data.y);
    case 'power': return new PowerPickup(data.x, data.y, data.powerId);
    case 'foxstatue': return new FoxStatuePickup(data.x, data.y);
    default: return new CoinPickup(data.x, data.y);
  }
}
