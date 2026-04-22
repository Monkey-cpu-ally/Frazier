export class Input {
  constructor() {
    this.keys = {};
    this.prev = {};
    // Attack gesture tracking (tap / double-tap / hold-release).
    this._atkPressT = -1;      // timestamp (sec) of current press, -1 if not held
    this._atkLastTapT = -999;  // timestamp of last completed quick-tap release
    this._atkEvent = null;     // 'tap' | 'doubleTap' | 'holdRelease' | null, set per-update
    this._atkCharging = false; // true while key held beyond HOLD_THRESHOLD
    this._onDown = (e) => {
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)) e.preventDefault();
      this.keys[e.code] = true;
    };
    this._onUp = (e) => { this.keys[e.code] = false; };
    window.addEventListener('keydown', this._onDown);
    window.addEventListener('keyup', this._onUp);
  }

  destroy() {
    window.removeEventListener('keydown', this._onDown);
    window.removeEventListener('keyup', this._onUp);
  }

  update() {
    this._jp = {};
    this._jr = {};
    for (const k in this.keys) {
      this._jp[k] = this.keys[k] && !this.prev[k];
      this._jr[k] = !this.keys[k] && this.prev[k];
    }
    this.prev = { ...this.keys };

    // ── Attack gesture classifier ─────────────────────────────────
    // KeyJ/KeyX are the attack buttons. We classify releases into:
    //   tap          — quick press (< TAP_MAX_HOLD) with no recent tap
    //   doubleTap    — quick press following another quick release within DOUBLE_WINDOW
    //   holdRelease  — release after holding >= HOLD_THRESHOLD (heavy charge-up)
    const TAP_MAX_HOLD   = 0.22;
    const DOUBLE_WINDOW  = 0.25;
    const HOLD_THRESHOLD = 0.28;
    const now = performance.now() / 1000;
    this._atkEvent = null;
    const pressed  = this._jp['KeyJ'] || this._jp['KeyX'];
    const released = this._jr['KeyJ'] || this._jr['KeyX'];

    if (pressed) {
      this._atkPressT = now;
      this._atkCharging = false;
    }
    // While held past threshold, flag "charging" so the player can draw a glow.
    if (this._atkPressT > 0 && !released) {
      if (now - this._atkPressT >= HOLD_THRESHOLD) this._atkCharging = true;
    }
    if (released && this._atkPressT > 0) {
      const held = now - this._atkPressT;
      if (held >= HOLD_THRESHOLD) {
        this._atkEvent = 'holdRelease';
      } else if (now - this._atkLastTapT <= DOUBLE_WINDOW) {
        this._atkEvent = 'doubleTap';
        this._atkLastTapT = -999;  // consume — prevents triple-tap stacking
      } else if (held <= TAP_MAX_HOLD) {
        this._atkEvent = 'tap';
        this._atkLastTapT = now;
      }
      this._atkPressT = -1;
      this._atkCharging = false;
    }
  }

  down(k) { return !!this.keys[k]; }
  just(k) { return !!this._jp[k]; }
  released(k) { return !!this._jr[k]; }

  get left() { return this.down('KeyA') || this.down('ArrowLeft'); }
  get right() { return this.down('KeyD') || this.down('ArrowRight'); }
  get dn() { return this.down('KeyS') || this.down('ArrowDown'); }
  get jump() { return this.just('Space') || this.just('ArrowUp') || this.just('KeyW'); }
  get jumpHeld() { return this.down('Space') || this.down('ArrowUp') || this.down('KeyW'); }
  get jumpRel() { return this.released('Space') || this.released('ArrowUp') || this.released('KeyW'); }
  // Legacy "attack on press" retained — used for air attack / smash where
  // instant response beats the tap/hold disambiguation delay.
  get attack() { return this.just('KeyJ') || this.just('KeyX'); }
  // Gesture-aware ground attack — fires on release, distinguishes combo level.
  // Returns 'tap' | 'doubleTap' | 'holdRelease' | null. Read once per frame.
  get attackGesture() { return this._atkEvent; }
  get attackCharging() { return this._atkCharging; }
  get special() { return this.just('KeyK') || this.just('KeyZ'); }
  get interact() { return this.just('KeyE'); }
  get dash() { return this.just('ShiftLeft') || this.just('ShiftRight'); }
  get assist() { return this.just('KeyQ'); }
}
