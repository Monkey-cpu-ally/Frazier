export class Input {
  constructor() {
    this.keys = {};
    this.prev = {};
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
  get attack() { return this.just('KeyJ') || this.just('KeyX'); }
  get special() { return this.just('KeyK') || this.just('KeyZ'); }
  get interact() { return this.just('KeyE'); }
  get dash() { return this.just('ShiftLeft') || this.just('ShiftRight'); }
  get assist() { return this.just('KeyQ'); }
}
