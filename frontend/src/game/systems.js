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

  activate(powerId, overrideDur = null) {
    const p = POWERS[powerId];
    if (!p) return;
    this.active = p;
    this.id = powerId;
    this.timer = overrideDur !== null ? overrideDur : p.dur;
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

// ===== Achievement Tracker =====
// Watches engine events and emits achievement IDs as they unlock.
export class AchievementTracker {
  constructor(onUnlock, initiallyUnlocked = []) {
    this.onUnlock = onUnlock || (() => {});
    this.unlocked = new Set(initiallyUnlocked);
    // per-run counters — reset() for fresh run; persistent totals live in progress
    this.enemiesKilled = 0;
    this.wallJumps = 0;
    this.dashes = 0;
    this.combo3s = 0;
    this.powersUsed = new Set();
    this.levelDamageTaken = 0;
    this.level1StartT = null;
    this.level1TimeMs = null;
    this.secretsFound = 0;
  }

  has(id) { return this.unlocked.has(id); }

  // Generic unlock. Respects already-unlocked ids.
  _unlock(id) {
    if (this.unlocked.has(id)) return;
    this.unlocked.add(id);
    this.onUnlock(id);
  }

  // ===== Hooks called from game code =====
  onEnemyKilled() {
    this.enemiesKilled++;
    this._unlock('first_blood');
  }
  onComboFinished() { // combo 3
    this._unlock('combo_master');
  }
  onWallJump() {
    this.wallJumps++;
    if (this.wallJumps >= 10) this._unlock('wall_jumper');
  }
  onDash() {
    this.dashes++;
    if (this.dashes >= 50) this._unlock('dasher');
  }
  onPowerActivated(id) {
    this.powersUsed.add(id);
    if (this.powersUsed.size >= 6) this._unlock('power_user');
  }
  onBossDefeated() {
    this._unlock('boss_slayer');
  }
  onMirrorFragment(total, ofTotal) {
    if (total >= 1) {
      this._unlock('fragment_1');
      this._unlock('explorer'); // fragments ARE the hidden secrets
    }
    if (total >= ofTotal) this._unlock('fragment_all');
  }
  onSecretEntered() {
    this.secretsFound++;
    this._unlock('explorer');
  }
  onLevelStart(levelIndex) {
    this.levelDamageTaken = 0;
    if (levelIndex === 0) this.level1StartT = performance.now();
  }
  onPlayerDamaged() { this.levelDamageTaken++; }
  onLevelCompleted(levelIndex) {
    if (this.levelDamageTaken === 0) this._unlock('no_damage_level');
    if (levelIndex === 0 && this.level1StartT !== null) {
      const elapsed = performance.now() - this.level1StartT;
      this.level1TimeMs = elapsed;
      if (elapsed < 30_000) this._unlock('speed_run');
    }
  }
  // Called with accumulated progress totals (coins, scrap, levels completed, score)
  // so we unlock thresholds the moment they're reached this run.
  syncTotals({ totalCoins, totalScrap, levelsCompleted, score }) {
    if ((totalCoins || 0) >= 50) this._unlock('coin_collector');
    if ((totalScrap || 0) >= 20) this._unlock('scrap_hoarder');
    if ((levelsCompleted || 0) >= 10) this._unlock('all_levels');
    if ((score || 0) > 5000) this._unlock('high_score');
  }
}
