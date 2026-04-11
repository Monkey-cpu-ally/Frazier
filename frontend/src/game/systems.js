import { POWERS } from './constants';

export class GameState {
  constructor() { this.reset(); }

  reset() {
    this.maxStickers = 3;
    this.stickers = 3;
    this.stickerChip = 0;
    this.coins = 0;
    this.scrapParts = 0;
    this.scrapMeter = 0;
    this.maxScrap = 100;
    this.score = 0;
    this.pickupText = '';
    this.pickupTimer = 0;
  }

  chipSticker(heavy) {
    if (heavy) {
      this.stickers = Math.max(0, this.stickers - 1);
      this.stickerChip = 0;
    } else {
      this.stickerChip++;
      if (this.stickerChip >= 3) {
        this.stickers = Math.max(0, this.stickers - 1);
        this.stickerChip = 0;
      }
    }
    return this.stickers <= 0;
  }

  healSticker() {
    if (this.stickers < this.maxStickers) {
      this.stickers++;
      this.stickerChip = 0;
    }
  }

  addCoin(n = 1) { this.coins += n; this.score += 10 * n; this.showPickup(`+${n} Coin`); }
  addScrap(n = 1) {
    this.scrapParts += n;
    this.scrapMeter = Math.min(this.maxScrap, this.scrapMeter + n * 12);
    this.showPickup(`+${n} Scrap`);
  }
  addFood() { this.healSticker(); this.showPickup('Health restored!'); }

  spendScrap(cost) {
    if (this.scrapMeter >= cost) { this.scrapMeter -= cost; return true; }
    return false;
  }

  addScore(n) { this.score += n; }

  showPickup(txt) { this.pickupText = txt; this.pickupTimer = 1.5; }

  update(dt) {
    if (this.pickupTimer > 0) this.pickupTimer -= dt;
  }
}

export class PowerManager {
  constructor() { this.reset(); }

  reset() {
    this.active = null;
    this.timer = 0;
    this.id = null;
  }

  activate(powerId) {
    const p = POWERS[powerId];
    if (!p) return;
    this.active = p;
    this.id = powerId;
    this.timer = p.dur;
  }

  update(dt) {
    if (this.active) {
      this.timer -= dt;
      if (this.timer <= 0) { this.active = null; this.id = null; this.timer = 0; }
    }
  }

  get isActive() { return !!this.active; }
  get isBurningBuffalo() { return this.id === 'burning_buffalo'; }
  get isGoldenGloves() { return this.id === 'golden_gloves'; }
  get isSuperMode() { return this.id === 'super_mode'; }
  get isSpecterMode() { return this.id === 'specter_mode'; }
  get isShadowTag() { return this.id === 'shadow_tag'; }
  get isFighterPlane() { return this.id === 'fighter_plane'; }
}

export class FlightLog {
  constructor() { this.entries = []; }

  add(text, category = 'general') {
    this.entries.unshift({ text, category, time: Date.now() });
    if (this.entries.length > 50) this.entries.pop();
  }

  recent(n = 5) { return this.entries.slice(0, n); }
}
