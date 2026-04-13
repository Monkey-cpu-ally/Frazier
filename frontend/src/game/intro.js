// HYPER AXEL: SHATTERED MIRRORS — Logo Intro Animation
// 8-second cinematic Canvas animation with synthesized audio

export class IntroAnimation {
  constructor(canvas, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onComplete = onComplete;
    this.W = canvas.width;
    this.H = canvas.height;
    this.time = 0;
    this.running = false;
    this.phase = 0;
    this.particles = [];
    this.fragments = [];
    this.shards = [];
    this.letterShards = [];
    this.audioPlayed = {};

    // Audio
    this.audioCtx = null;

    // Generate fragments
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      this.fragments.push({
        x: Math.cos(angle) * 200,
        y: Math.sin(angle) * 150,
        targetX: 0, targetY: 0,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2,
        size: 30 + Math.random() * 15,
        alpha: 0,
        hue: i * 90,
        glitch: 0,
      });
    }

    // Void particles
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        size: 1 + Math.random() * 2.5,
        alpha: 0.05 + Math.random() * 0.15,
        hue: Math.random() * 360,
      });
    }

    // Shatter shards (for phase 5-6)
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      this.shards.push({
        x: 0, y: 0,
        targetX: Math.cos(angle) * (200 + Math.random() * 100),
        targetY: Math.sin(angle) * (120 + Math.random() * 60),
        rot: Math.random() * Math.PI,
        size: 8 + Math.random() * 16,
        alpha: 0,
        hue: (i / 24) * 360,
        settled: false,
      });
    }
  }

  _ensureAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    return this.audioCtx;
  }

  _playTone(freq, dur, type = 'sine', vol = 0.1, delay = 0) {
    const ctx = this._ensureAudio();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  _playNoise(dur, vol = 0.05, delay = 0) {
    const ctx = this._ensureAudio();
    const t = ctx.currentTime + delay;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 2;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t);
  }

  // Sound cues for each phase
  _audioPhase1() {
    // Low hum + glass resonance
    this._playTone(55, 3, 'sine', 0.08);
    this._playTone(82.4, 3, 'sine', 0.04);
    this._playNoise(2, 0.02);
  }

  _audioPhase2() {
    // Crystal chimes
    [1200, 1500, 1800, 2200].forEach((f, i) => {
      this._playTone(f, 0.8, 'sine', 0.04, i * 0.3);
    });
    this._playNoise(1.5, 0.015, 0.2);
  }

  _audioPhase3() {
    // Energy pull + snap impact
    this._playTone(100, 0.6, 'sawtooth', 0.08);
    this._playTone(60, 0.15, 'square', 0.15, 0.5);
    this._playNoise(0.2, 0.12, 0.5);
    // Bright flash sound
    this._playTone(800, 0.3, 'sine', 0.1, 0.55);
    this._playTone(1200, 0.2, 'sine', 0.06, 0.6);
  }

  _audioPhase4() {
    // Clean crystal tone + completion
    this._playTone(440, 1.5, 'sine', 0.06);
    this._playTone(554, 1.2, 'sine', 0.04, 0.1);
    this._playTone(659, 1.0, 'sine', 0.04, 0.2);
    this._playTone(110, 0.8, 'sine', 0.06, 0.3);
  }

  _audioPhase5() {
    // Shatter burst
    this._playNoise(0.4, 0.15);
    this._playTone(200, 0.3, 'sawtooth', 0.1);
    [400, 600, 900, 1300].forEach((f, i) => {
      this._playTone(f, 0.15, 'sine', 0.03, i * 0.03);
    });
  }

  _audioPhase6() {
    // Logo slam sounds
    for (let i = 0; i < 9; i++) {
      this._playTone(80 + i * 20, 0.1, 'square', 0.04, i * 0.05);
    }
    this._playNoise(0.3, 0.06, 0.3);
  }

  _audioPhase7() {
    // Key lock + satisfaction
    this._playTone(523, 0.4, 'sine', 0.08);
    this._playTone(659, 0.4, 'sine', 0.06, 0.1);
    this._playTone(784, 0.6, 'sine', 0.08, 0.2);
    this._playTone(1047, 0.8, 'sine', 0.06, 0.3);
    // Deep lock
    this._playTone(130, 0.5, 'sine', 0.1, 0.35);
  }

  start() {
    this.running = true;
    this.time = 0;
    this.lastTime = performance.now();
    this._loop();
  }

  skip() {
    this.running = false;
    if (this.onComplete) this.onComplete();
  }

  _loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.time += dt;

    // Phase transitions
    if (this.time < 1) this.phase = 1;
    else if (this.time < 3) this.phase = 2;
    else if (this.time < 4) this.phase = 3;
    else if (this.time < 5) this.phase = 4;
    else if (this.time < 6) this.phase = 5;
    else if (this.time < 7) this.phase = 6;
    else if (this.time < 8.5) this.phase = 7;
    else {
      this.running = false;
      if (this.onComplete) this.onComplete();
      return;
    }

    // Trigger audio per phase (once)
    if (this.phase >= 1 && !this.audioPlayed[1]) { this.audioPlayed[1] = true; this._audioPhase1(); }
    if (this.phase >= 2 && !this.audioPlayed[2]) { this.audioPlayed[2] = true; this._audioPhase2(); }
    if (this.phase >= 3 && !this.audioPlayed[3]) { this.audioPlayed[3] = true; this._audioPhase3(); }
    if (this.phase >= 4 && !this.audioPlayed[4]) { this.audioPlayed[4] = true; this._audioPhase4(); }
    if (this.phase >= 5 && !this.audioPlayed[5]) { this.audioPlayed[5] = true; this._audioPhase5(); }
    if (this.phase >= 6 && !this.audioPlayed[6]) { this.audioPlayed[6] = true; this._audioPhase6(); }
    if (this.phase >= 7 && !this.audioPlayed[7]) { this.audioPlayed[7] = true; this._audioPhase7(); }

    this._update(dt);
    this._render();
    requestAnimationFrame(this._loop);
  }

  _update(dt) {
    // Particles always float
    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0) p.x = this.W;
      if (p.x > this.W) p.x = 0;
      if (p.y < 0) p.y = this.H;
      if (p.y > this.H) p.y = 0;
      p.hue += dt * 20;
    });

    const cx = this.W / 2, cy = this.H / 2;

    // Fragment behavior per phase
    if (this.phase >= 2) {
      this.fragments.forEach((f, i) => {
        f.alpha = Math.min(1, f.alpha + dt * 1.5);
        f.rot += f.rotSpeed * dt;
        f.glitch = Math.sin(this.time * 15 + i) * 3;

        if (this.phase >= 3) {
          // Pull toward center
          const pull = Math.min(1, (this.time - 3) / 0.8);
          f.x += (f.targetX - f.x) * pull * 8 * dt;
          f.y += (f.targetY - f.y) * pull * 8 * dt;
          f.rotSpeed *= 0.95;
        }
      });
    }

    // Shards behavior
    if (this.phase >= 5) {
      const shatterT = this.time - 5;
      this.shards.forEach((s, i) => {
        if (shatterT < 0.3) {
          // Explode outward
          s.alpha = Math.min(1, shatterT * 8);
          const prog = shatterT / 0.3;
          s.x = s.targetX * prog;
          s.y = s.targetY * prog;
          s.rot += dt * 10;
        } else if (this.phase >= 6) {
          // Settle into logo positions
          s.settled = true;
          s.alpha = Math.max(0.3, s.alpha - dt * 0.5);
        }
      });
    }
  }

  _render() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    const cx = W / 2, cy = H / 2;

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    // === PHASE 1: VOID ===
    if (this.phase >= 1) {
      // Subtle vignette
      const vg = ctx.createRadialGradient(cx, cy, 100, cx, cy, W * 0.6);
      vg.addColorStop(0, 'rgba(15,10,25,0.3)');
      vg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // Floating particles
      this.particles.forEach(p => {
        const a = p.alpha * (this.phase >= 5 ? 0.5 : 1);
        ctx.globalAlpha = a;
        ctx.fillStyle = `hsl(${p.hue}, 60%, 70%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // === PHASE 2: FRAGMENTS AWAKEN ===
    if (this.phase >= 2 && this.phase < 5) {
      this.fragments.forEach((f, i) => {
        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.translate(cx + f.x + f.glitch, cy + f.y);
        ctx.rotate(f.rot);

        // Crystal fragment (diamond shape)
        const s = f.size;
        const hue = f.hue + this.time * 30;

        // Glow
        ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
        ctx.shadowBlur = 20;

        // Fragment body
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, s * 0.8);
        ctx.lineTo(-s * 0.6, 0);
        ctx.closePath();
        ctx.fill();

        // Inner rainbow energy
        ctx.fillStyle = `hsla(${hue + 60}, 90%, 70%, 0.4)`;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.5);
        ctx.lineTo(s * 0.3, 0);
        ctx.lineTo(0, s * 0.4);
        ctx.lineTo(-s * 0.3, 0);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
      });
    }

    // === PHASE 3: COLLISION FLASH ===
    if (this.phase === 3 && this.time > 3.5) {
      const flashT = (this.time - 3.5) / 0.5;
      if (flashT < 1) {
        ctx.globalAlpha = (1 - flashT) * 0.8;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }

    // === PHASE 4: MIRROR FORMS ===
    if (this.phase === 4) {
      const mirrorT = this.time - 4;
      const mirrorAlpha = Math.min(1, mirrorT * 2);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = mirrorAlpha;

      // Mirror body (octagon)
      const mr = 70 + Math.sin(this.time * 2) * 5;
      ctx.shadowColor = 'rgba(100,200,255,0.6)';
      ctx.shadowBlur = 30;

      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, mr);
      grad.addColorStop(0, 'rgba(200,220,255,0.9)');
      grad.addColorStop(0.5, 'rgba(100,180,255,0.6)');
      grad.addColorStop(1, 'rgba(60,100,200,0.3)');
      ctx.fillStyle = grad;

      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * mr;
        const py = Math.sin(a) * mr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Key silhouette inside
      if (mirrorT > 0.4) {
        const keyAlpha = Math.min(1, (mirrorT - 0.4) * 3);
        ctx.globalAlpha = keyAlpha * 0.7;
        ctx.fillStyle = '#FFD700';
        // Key head
        ctx.beginPath();
        ctx.arc(0, -15, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-3, -5, 6, 30);
        // Key teeth
        ctx.fillRect(3, 15, 8, 4);
        ctx.fillRect(3, 22, 6, 3);
      }

      ctx.shadowBlur = 0;
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // === PHASE 5: SHATTER BURST ===
    if (this.phase >= 5) {
      ctx.save();
      ctx.translate(cx, cy);

      // Shockwave ring
      if (this.phase === 5 && this.time < 5.5) {
        const ringT = (this.time - 5) / 0.5;
        ctx.globalAlpha = (1 - ringT) * 0.6;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, ringT * 300, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Shards
      this.shards.forEach(s => {
        if (s.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        const hue = s.hue + this.time * 15;
        ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
        ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
        ctx.shadowBlur = 8;
        ctx.fillRect(-s.size / 2, -s.size / 4, s.size, s.size / 2);
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      ctx.restore();
    }

    // === PHASE 6-7: LOGO REVEAL ===
    if (this.phase >= 6) {
      const logoT = this.time - 6;
      const titleAlpha = Math.min(1, logoT * 2);

      ctx.save();
      ctx.globalAlpha = titleAlpha;

      // Rainbow energy cracks on letters
      const crackGlow = Math.sin(this.time * 4) * 0.15 + 0.85;

      // HYPER AXEL
      ctx.font = 'bold 84px "Anton", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text shadow/glow
      ctx.shadowColor = `hsla(${this.time * 40 % 360}, 80%, 50%, 0.5)`;
      ctx.shadowBlur = 20 * crackGlow;

      // Build letters piece by piece
      const title = 'HYPER AXEL';
      const letterWidth = 58;
      const startX = cx - (title.length * letterWidth) / 2 + letterWidth / 2;

      title.split('').forEach((ch, i) => {
        if (ch === ' ') return;
        const letterDelay = i * 0.04;
        const letterProg = Math.min(1, (logoT - letterDelay) * 4);
        if (letterProg <= 0) return;

        const lx = startX + i * letterWidth;
        const ly = cy - 15;

        // Letter slam from above
        const slamY = ly - (1 - letterProg) * 60;
        const slamAlpha = letterProg;

        ctx.globalAlpha = titleAlpha * slamAlpha;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(ch, lx, slamY);

        // Rainbow crack glow on each letter
        if (letterProg > 0.8) {
          ctx.globalAlpha = (letterProg - 0.8) * 5 * 0.3;
          ctx.fillStyle = `hsl(${(i * 40 + this.time * 60) % 360}, 80%, 60%)`;
          ctx.fillText(ch, lx, slamY);
        }
      });

      ctx.shadowBlur = 0;

      // SHATTERED MIRRORS subtitle
      if (logoT > 0.6) {
        const subAlpha = Math.min(1, (logoT - 0.6) * 3);
        ctx.globalAlpha = titleAlpha * subAlpha;
        ctx.font = '600 24px "Fredoka", sans-serif';
        ctx.fillStyle = '#FFD60A';
        ctx.letterSpacing = '8px';
        ctx.fillText('S H A T T E R E D   M I R R O R S', cx, cy + 45);
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // === PHASE 7: KEY LOCK ===
    if (this.phase >= 7) {
      const keyT = this.time - 7;
      const keyDrop = Math.min(1, keyT * 3);
      const keyY = cy + 80 + (1 - keyDrop) * -100;
      const keyAlpha = Math.min(1, keyT * 4);

      ctx.save();
      ctx.globalAlpha = keyAlpha;
      ctx.translate(cx, keyY);

      // Gold key
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = 'rgba(255,215,0,0.5)';
      ctx.shadowBlur = keyDrop > 0.9 ? 20 : 5;

      // Key head (circle)
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      // Key hole
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      // Key shaft
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-2, 8, 4, 18);
      // Key teeth
      ctx.fillRect(2, 20, 5, 3);
      ctx.fillRect(2, 24, 4, 2);

      // Glow pulse when locked
      if (keyDrop >= 0.95) {
        const pulse = Math.sin((keyT - 0.3) * 6) * 0.3 + 0.5;
        ctx.globalAlpha = pulse * 0.3;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 10, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // Screen shake (phase 3 & 5)
    if ((this.phase === 3 && this.time > 3.4 && this.time < 3.8) ||
        (this.phase === 5 && this.time > 5 && this.time < 5.3)) {
      // Applied via slight canvas translate in the loop
    }

    // Skip hint
    if (this.time > 1) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px "Nunito", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Press any key to skip', cx, H - 24);
      ctx.globalAlpha = 1;
    }
  }
}
