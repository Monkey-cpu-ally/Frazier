export class Camera {
  constructor(vw, vh) {
    this.x = 0; this.y = 0;
    this.vw = vw; this.vh = vh;
    this.smooth = 8;
    this.lim = { l: -9999, t: -9999, r: 9999, b: 9999 };
    this.sk = { x: 0, y: 0, int: 0, dur: 0 };
    this.shakeEnabled = true;
  }

  setLimits(l, t, r, b) { this.lim = { l, t, r, b }; }

  follow(tx, ty, dt) {
    const dx = tx - this.vw / 2 - this.x;
    const dy = ty - this.vh / 2 - this.y;
    this.x += dx * this.smooth * dt;
    this.y += dy * this.smooth * dt;
    this.x = Math.max(this.lim.l, Math.min(this.x, this.lim.r - this.vw));
    this.y = Math.max(this.lim.t, Math.min(this.y, this.lim.b - this.vh));
  }

  shake(intensity, dur) {
    if (!this.shakeEnabled) return;
    this.sk.int = intensity;
    this.sk.dur = dur;
  }

  updateShake(dt) {
    if (this.sk.dur > 0) {
      this.sk.dur -= dt;
      this.sk.x = (Math.random() - 0.5) * 2 * this.sk.int;
      this.sk.y = (Math.random() - 0.5) * 2 * this.sk.int;
    } else { this.sk.x = 0; this.sk.y = 0; }
  }

  apply(ctx) {
    ctx.translate(Math.round(-this.x + this.sk.x), Math.round(-this.y + this.sk.y));
  }

  worldToScreen(wx, wy) {
    return { x: wx - this.x + this.sk.x, y: wy - this.y + this.sk.y };
  }
}
