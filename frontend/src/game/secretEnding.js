// Secret ending animation - plays when all 4 mirror fragments collected
// Shows Axel inside the mirror, reality reforming

export class SecretEnding {
  constructor(canvas, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onComplete = onComplete;
    this.W = canvas.width;
    this.H = canvas.height;
    this.time = 0;
    this.running = false;
    this.phase = 0;
    this.shards = [];
    this.audioCtx = null;
    this.audioPlayed = {};

    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      this.shards.push({
        x: Math.cos(angle) * (300 + Math.random() * 100),
        y: Math.sin(angle) * (200 + Math.random() * 80),
        homeX: Math.cos(angle) * 80,
        homeY: Math.sin(angle) * 60,
        rot: Math.random() * Math.PI * 2,
        size: 6 + Math.random() * 12,
        hue: (i / 40) * 360,
        alpha: 0,
      });
    }
  }

  _ensureAudio() {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    return this.audioCtx;
  }

  _tone(freq, dur, type = 'sine', vol = 0.08, delay = 0) {
    const ctx = this._ensureAudio();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur);
  }

  start() {
    this.running = true;
    this.time = 0;
    this.lastTime = performance.now();
    this._loop();
  }

  skip() { this.running = false; if (this.onComplete) this.onComplete(); }

  _loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.time += dt;

    if (this.time < 2) this.phase = 1;
    else if (this.time < 5) this.phase = 2;
    else if (this.time < 8) this.phase = 3;
    else if (this.time < 12) this.phase = 4;
    else { this.running = false; if (this.onComplete) this.onComplete(); return; }

    // Audio
    if (this.phase >= 1 && !this.audioPlayed[1]) {
      this.audioPlayed[1] = true;
      this._tone(55, 4, 'sine', 0.1);
      this._tone(82, 4, 'sine', 0.06);
    }
    if (this.phase >= 2 && !this.audioPlayed[2]) {
      this.audioPlayed[2] = true;
      [440, 554, 659, 880].forEach((f, i) => this._tone(f, 2, 'sine', 0.05, i * 0.5));
    }
    if (this.phase >= 3 && !this.audioPlayed[3]) {
      this.audioPlayed[3] = true;
      this._tone(130, 3, 'sine', 0.1);
      [523, 659, 784, 1047, 1319].forEach((f, i) => this._tone(f, 1.5, 'sine', 0.04, i * 0.3));
    }
    if (this.phase >= 4 && !this.audioPlayed[4]) {
      this.audioPlayed[4] = true;
      [262, 330, 392, 523, 659, 784].forEach((f, i) => this._tone(f, 2, 'sine', 0.06, i * 0.4));
    }

    this._render();
    requestAnimationFrame(this._loop);
  }

  _render() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    const cx = W / 2, cy = H / 2;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // Phase 1: Scattered shards in darkness
    if (this.phase >= 1) {
      this.shards.forEach((s, i) => {
        const prog = Math.min(1, this.time / 2);
        s.alpha = prog * 0.7;
        s.rot += 0.01;
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(cx + s.x, cy + s.y);
        ctx.rotate(s.rot);
        ctx.fillStyle = `hsl(${s.hue + this.time * 20}, 70%, 55%)`;
        ctx.fillRect(-s.size / 2, -s.size / 4, s.size, s.size / 2);
        ctx.restore();
      });
    }

    // Phase 2: Shards pull toward center, forming mirror
    if (this.phase >= 2) {
      const pull = Math.min(1, (this.time - 2) / 3);
      this.shards.forEach(s => {
        s.x += (s.homeX - s.x) * pull * 0.03;
        s.y += (s.homeY - s.y) * pull * 0.03;
      });

      // Forming mirror glow
      ctx.globalAlpha = pull * 0.5;
      const mg = ctx.createRadialGradient(cx, cy, 10, cx, cy, 100);
      mg.addColorStop(0, 'rgba(200,220,255,0.8)');
      mg.addColorStop(1, 'rgba(100,150,255,0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(cx, cy, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Phase 3: Mirror complete — Axel silhouette visible inside
    if (this.phase >= 3) {
      const mirrorAlpha = Math.min(1, (this.time - 5) / 1);

      // Mirror surface
      ctx.save();
      ctx.globalAlpha = mirrorAlpha;
      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 80);
      grad.addColorStop(0, 'rgba(220,240,255,0.9)');
      grad.addColorStop(0.6, 'rgba(100,180,255,0.5)');
      grad.addColorStop(1, 'rgba(60,100,200,0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r = 80;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Axel silhouette inside mirror
      if (this.time > 6) {
        const axelAlpha = Math.min(1, (this.time - 6) * 0.8);
        ctx.globalAlpha = axelAlpha * 0.8;
        // Simple Axel shape
        ctx.fillStyle = '#FFD700';
        // Head
        ctx.beginPath();
        ctx.arc(cx, cy - 20, 12, 0, Math.PI * 2);
        ctx.fill();
        // Cap
        ctx.fillStyle = '#E23B2A';
        ctx.fillRect(cx - 14, cy - 34, 28, 10);
        // Body
        ctx.fillStyle = '#4A6B8A';
        ctx.fillRect(cx - 10, cy - 8, 20, 22);
        // Wrench
        ctx.fillStyle = '#A0A8B0';
        ctx.save();
        ctx.translate(cx + 14, cy - 12);
        ctx.rotate(-0.3);
        ctx.fillRect(-2, -20, 4, 24);
        ctx.fillRect(-5, -26, 10, 8);
        ctx.restore();
      }

      ctx.restore();
    }

    // Phase 4: Text reveal
    if (this.phase >= 4) {
      const textAlpha = Math.min(1, (this.time - 8) / 2);
      ctx.globalAlpha = textAlpha;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 42px "Anton", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('THE MIRROR REMEMBERS', cx, cy + 140);

      ctx.fillStyle = '#FFD60A';
      ctx.font = '18px "Fredoka", sans-serif';
      ctx.fillText('All fragments restored. Reality holds... for now.', cx, cy + 175);

      if (this.time > 10) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '14px "Nunito", sans-serif';
        ctx.fillText('Press any key to continue', cx, H - 40);
      }

      ctx.globalAlpha = 1;
    }
  }
}
