// Retro-style synthesized sound effects using Web Audio API

class SFXEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.35;
  }

  _ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _gain(v = 1) {
    const g = this._ensure().createGain();
    g.gain.value = v * this.volume;
    g.connect(this.ctx.destination);
    return g;
  }

  // Quick tone burst
  _tone(freq, dur, type = 'square', vol = 0.5) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    const osc = ctx.createOscillator();
    const gain = this._gain(vol);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(gain);
    gain.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  }

  // Sweep (pitch slides)
  _sweep(startFreq, endFreq, dur, type = 'square', vol = 0.4) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    const osc = ctx.createOscillator();
    const gain = this._gain(vol);
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + dur);
    osc.connect(gain);
    gain.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  }

  // Noise burst
  _noise(dur, vol = 0.3) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this._gain(vol);
    source.connect(gain);
    gain.gain.setValueAtTime(vol * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    source.start(ctx.currentTime);
  }

  // === Game sounds ===

  jump() {
    this._sweep(200, 600, 0.15, 'square', 0.3);
  }

  land() {
    this._noise(0.06, 0.15);
  }

  wrenchSwing() {
    this._sweep(300, 150, 0.1, 'sawtooth', 0.25);
    this._noise(0.05, 0.12);
  }

  wrenchHit() {
    this._tone(200, 0.08, 'square', 0.4);
    this._noise(0.08, 0.3);
    setTimeout(() => this._tone(150, 0.05, 'square', 0.2), 30);
  }

  comboFinish() {
    this._tone(300, 0.05, 'square', 0.35);
    setTimeout(() => this._tone(400, 0.05, 'square', 0.35), 40);
    setTimeout(() => this._tone(500, 0.08, 'square', 0.4), 80);
    this._noise(0.12, 0.25);
  }

  smash() {
    this._sweep(400, 80, 0.2, 'square', 0.5);
    this._noise(0.15, 0.4);
  }

  playerHurt() {
    this._sweep(400, 200, 0.2, 'square', 0.35);
    setTimeout(() => this._sweep(300, 150, 0.15, 'square', 0.25), 100);
  }

  playerDeath() {
    this._sweep(500, 80, 0.5, 'square', 0.4);
    setTimeout(() => this._sweep(200, 50, 0.4, 'sawtooth', 0.3), 200);
  }

  enemyHit() {
    this._tone(250, 0.06, 'square', 0.3);
    this._noise(0.04, 0.2);
  }

  enemyDeath() {
    this._sweep(300, 100, 0.2, 'square', 0.3);
    this._noise(0.1, 0.25);
  }

  coinPickup() {
    this._tone(800, 0.06, 'square', 0.25);
    setTimeout(() => this._tone(1000, 0.08, 'square', 0.25), 60);
  }

  scrapPickup() {
    this._tone(400, 0.05, 'triangle', 0.3);
    setTimeout(() => this._tone(600, 0.07, 'triangle', 0.3), 50);
  }

  foodPickup() {
    this._tone(600, 0.05, 'sine', 0.3);
    setTimeout(() => this._tone(800, 0.05, 'sine', 0.3), 50);
    setTimeout(() => this._tone(1000, 0.08, 'sine', 0.35), 100);
  }

  powerPickup() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this._tone(400 + i * 120, 0.06, 'square', 0.3), i * 40);
    }
  }

  breakWall() {
    this._noise(0.2, 0.4);
    this._sweep(200, 60, 0.25, 'sawtooth', 0.3);
  }

  bossRoar() {
    this._sweep(120, 60, 0.5, 'sawtooth', 0.5);
    this._noise(0.3, 0.35);
    setTimeout(() => this._sweep(100, 50, 0.4, 'sawtooth', 0.4), 200);
  }

  bossHit() {
    this._tone(120, 0.1, 'square', 0.4);
    this._noise(0.12, 0.35);
    setTimeout(() => this._tone(80, 0.08, 'square', 0.3), 50);
  }

  bossVulnerable() {
    this._tone(600, 0.1, 'triangle', 0.3);
    setTimeout(() => this._tone(500, 0.1, 'triangle', 0.25), 80);
    setTimeout(() => this._tone(400, 0.12, 'triangle', 0.2), 160);
  }

  bossDeath() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this._noise(0.1, 0.3);
        this._tone(150 - i * 10, 0.08, 'square', 0.3);
      }, i * 100);
    }
  }

  levelComplete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this._tone(n, 0.15, 'square', 0.3), i * 120);
    });
  }

  foxSpirit() {
    this._tone(800, 0.12, 'sine', 0.2);
    setTimeout(() => this._tone(1000, 0.15, 'sine', 0.25), 100);
    setTimeout(() => this._tone(1200, 0.2, 'sine', 0.2), 200);
  }

  uiClick() {
    this._tone(600, 0.04, 'square', 0.2);
  }

  uiStart() {
    this._sweep(300, 800, 0.2, 'square', 0.3);
    setTimeout(() => this._tone(800, 0.1, 'square', 0.3), 150);
  }

  // ── Title-screen atmosphere SFX ──────────────────────────────
  // Glass-shatter for the "SHATTERED MIRRORS" subtitle. Noise burst + shards.
  shatter() {
    const ctx = this._ensure();
    if (!ctx) return;
    // Noise burst for the break
    const bufLen = ctx.sampleRate * 0.35;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      const t = i / bufLen;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.6);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1200;
    const g = ctx.createGain();
    g.gain.value = 0.22;
    src.connect(hp); hp.connect(g); g.connect(ctx.destination);
    src.start();
    // Sparkling tinkles — 6 quick decaying square pings at random high freqs
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this._tone(2200 + Math.random() * 3800, 0.06 + Math.random() * 0.06,
                   'triangle', 0.12 + Math.random() * 0.08);
      }, 60 + i * 45 + Math.random() * 30);
    }
  }

  // Glimpse — warm ascending shimmer (like a title card "reveal").
  // 4-note arpeggio + soft chime tail.
  glimpse() {
    const notes = [523, 784, 1047, 1568];       // C5 G5 C6 G6
    notes.forEach((n, i) => {
      setTimeout(() => this._tone(n, 0.22, 'sine', 0.18), i * 90);
    });
    // Soft shimmer tail
    setTimeout(() => this._sweep(1568, 3200, 0.6, 'sine', 0.08), 420);
  }
}

// Singleton
export const sfx = new SFXEngine();
