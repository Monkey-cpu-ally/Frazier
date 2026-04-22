// Procedural background music using Web Audio API
// Generates ambient mechanical/nature soundtrack

class MusicEngine {
  constructor() {
    this.ctx = null;
    this.playing = false;
    this.volume = 0.2;
    this.enabled = true;
    this.nodes = {};
    this.currentTrack = null;
    this.beatTimer = 0;
    this.beatInterval = 0.5;
    this.measure = 0;
    this.bar = 0;
  }

  _ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);

      // Reverb (simple delay-based)
      this.delay = this.ctx.createDelay(0.5);
      this.delay.delayTime.value = 0.3;
      this.delayGain = this.ctx.createGain();
      this.delayGain.gain.value = 0.15;
      this.delay.connect(this.delayGain);
      this.delayGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setVolume(v) {
    this.volume = v;
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  // Scale: C minor pentatonic for moody mechanical feel
  _scale(degree) {
    const notes = [261.6, 311.1, 349.2, 392.0, 466.2, 523.3, 622.3, 698.5];
    return notes[degree % notes.length] * (degree >= notes.length ? 2 : 1);
  }

  // Ambient bass drone
  _playDrone(freq, dur) {
    const ctx = this._ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + dur - 0.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  }

  // Melodic note
  _playNote(freq, time, dur, type = 'triangle', vol = 0.08) {
    const ctx = this._ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.delay);
    osc.start(time);
    osc.stop(time + dur);
  }

  // Percussion tick
  _playTick(time, vol = 0.04) {
    const ctx = this._ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 80;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  // Hi-hat noise
  _playHat(time, vol = 0.025) {
    const ctx = this._ensure();
    const bufSize = ctx.sampleRate * 0.04;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(time);
  }

  // Generate a musical phrase
  _generatePhrase(startTime, bpm, bars) {
    const ctx = this._ensure();
    const beatLen = 60 / bpm;
    let t = startTime;

    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        const bt = t + (bar * 4 + beat) * beatLen;

        // Bass tick on every beat
        if (beat === 0) this._playTick(bt, 0.05);

        // Hi-hat on off-beats
        if (beat === 1 || beat === 3) this._playHat(bt, 0.02);

        // Melodic notes (semi-random from scale)
        if (Math.random() < 0.4) {
          const degree = Math.floor(Math.random() * 5);
          const freq = this._scale(degree);
          const dur = beatLen * (0.5 + Math.random() * 1.5);
          this._playNote(freq, bt, dur, 'triangle', 0.06 + Math.random() * 0.03);
        }

        // Occasional high melody
        if (Math.random() < 0.2 && beat > 0) {
          const degree = 4 + Math.floor(Math.random() * 4);
          const freq = this._scale(degree);
          this._playNote(freq, bt + beatLen * 0.5, beatLen * 0.8, 'sine', 0.04);
        }
      }
    }

    return bars * 4 * beatLen;
  }

  // Start ambient exploration track — chiptune platformer version.
  // Driving 8th-note square lead + triangle bass at 128 bpm.
  playExploration() {
    if (!this.enabled) return;
    if (this.playing && this.currentTrack === 'explore') return;
    this.stop();
    this._ensure();
    this.playing = true;
    this.currentTrack = 'explore';
    this._loopPhrase();
  }

  // Start boss battle track — tense descending minor-key chiptune at 160 bpm.
  playBoss() {
    if (!this.enabled) return;
    if (this.playing && this.currentTrack === 'boss') return;
    this.stop();
    this._ensure();
    this.playing = true;
    this.currentTrack = 'boss';
    this._loopBoss();
  }

  _loopPhrase() {
    if (!this.playing || this.currentTrack !== 'explore') return;
    const ctx = this._ensure();
    const bpm = 128;
    const beat = 60 / bpm / 2;  // 8th notes
    let t = ctx.currentTime + 0.1;
    // A-minor pentatonic arc, 32 notes = 4 bars of 8.
    const mel = [
      440, 523, 659, 880, 784, 659, 523, 440,
      494, 587, 740, 988, 880, 740, 587, 494,
      392, 494, 587, 784, 659, 494, 392, 330,
      440, 523, 659, 880, 784, 659, 587, 523,
    ];
    const bas = [
      220, 220, 330, 330, 220, 220, 330, 330,
      247, 247, 370, 370, 247, 247, 370, 370,
      196, 196, 294, 294, 196, 196, 294, 294,
      220, 220, 330, 330, 220, 220, 330, 330,
    ];
    for (let i = 0; i < 32; i++) {
      this._playNote(mel[i], t + i * beat, beat * 0.9, 'square', 0.055);
      this._playNote(bas[i], t + i * beat, beat * 0.95, 'triangle', 0.045);
      if (i % 4 === 0) this._playTick(t + i * beat, 0.05);
      if (i % 2 === 1) this._playHat(t + i * beat, 0.02);
    }
    const dur = 32 * beat;
    this._phraseTimeout = setTimeout(() => this._loopPhrase(), (dur - 0.05) * 1000);
  }

  _loopBoss() {
    if (!this.playing || this.currentTrack !== 'boss') return;
    const ctx = this._ensure();
    const bpm = 160;
    const beat = 60 / bpm / 2;
    let t = ctx.currentTime + 0.1;
    // D-minor tension — heavier hits on the downbeats, more chromatic lead.
    const mel = [
      294, 349, 440, 587, 523, 440, 349, 294,
      262, 330, 392, 523, 440, 392, 330, 262,
      233, 294, 370, 494, 440, 370, 294, 233,
      294, 440, 587, 880, 740, 587, 440, 294,
    ];
    const bas = [
      147, 147, 147, 147, 175, 175, 175, 175,
      131, 131, 131, 131, 165, 165, 165, 165,
      117, 117, 117, 117, 147, 147, 147, 147,
      147, 147, 175, 175, 220, 220, 294, 294,
    ];
    for (let i = 0; i < 32; i++) {
      this._playNote(mel[i], t + i * beat, beat * 0.9, 'square', 0.07);
      this._playNote(bas[i], t + i * beat, beat * 0.95, 'sawtooth', 0.055);
      if (i % 4 === 0 || i % 4 === 2) this._playTick(t + i * beat, 0.08);
      this._playHat(t + i * beat, 0.03);
    }
    const dur = 32 * beat;
    this._phraseTimeout = setTimeout(() => this._loopBoss(), (dur - 0.05) * 1000);
  }

  stop() {
    this.playing = false;
    this.currentTrack = null;
    if (this._phraseTimeout) {
      clearTimeout(this._phraseTimeout);
      this._phraseTimeout = null;
    }
    if (this._titleTimeout) {
      clearTimeout(this._titleTimeout);
      this._titleTimeout = null;
    }
  }

  // ── Waterfall rush (pink-noise ambient) — fades in/out, ducks music 45% ──
  startWaterRush() {
    if (!this.enabled) return;
    if (this._waterSrc) return;
    const ctx = this._ensure();
    // 2 seconds of pink-ish noise, looped.
    const bufLen = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2 + white * 0.31) * 0.22;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 2400;
    filt.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(filt); filt.connect(g); g.connect(this.masterGain || ctx.destination);
    src.start();
    g.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.4);
    this._waterSrc = src;
    this._waterGain = g;
    // Duck music for clarity
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.volume * 0.45, ctx.currentTime + 0.4);
    }
  }

  stopWaterRush() {
    if (!this._waterSrc) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    this._waterGain.gain.cancelScheduledValues(t);
    this._waterGain.gain.linearRampToValueAtTime(0.0, t + 0.4);
    const src = this._waterSrc;
    setTimeout(() => { try { src.stop(); } catch (e) {} }, 500);
    this._waterSrc = null;
    this._waterGain = null;
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, t + 0.5);
    }
  }

  // ── Title "glimpse" — short uplifting chiptune teaser ──────────
  // 4-bar loop: G major arpeggio with driving bass. Meant to hint at the
  // full gameplay music while staying light.
  playTitle() {
    if (!this.enabled) return;
    this.stop();
    this._ensure();
    this.playing = true;
    this.currentTrack = 'title';
    this._loopTitle();
  }

  _loopTitle() {
    if (!this.playing || this.currentTrack !== 'title') return;
    const ctx = this._ensure();
    const bpm = 112;
    const beat = 60 / bpm / 2;                          // 8th notes
    let t = ctx.currentTime + 0.1;
    // Melody — 16 notes: G major pentatonic arc
    const mel = [
      392, 587, 784, 988, 784, 587, 494, 392,
      440, 659, 880, 1109, 880, 659, 494, 440,
    ];
    const bass = [196, 196, 294, 294, 392, 392, 294, 294,
                  220, 220, 330, 330, 440, 440, 330, 330];
    for (let i = 0; i < 16; i++) {
      this._playNote(mel[i], t + i * beat, beat * 0.9, 'square', 0.055);
      this._playNote(bass[i], t + i * beat, beat * 0.95, 'triangle', 0.045);
      if (i % 4 === 0) this._playTick(t + i * beat, 0.05);
    }
    const dur = 16 * beat;
    this._titleTimeout = setTimeout(() => this._loopTitle(), (dur - 0.05) * 1000);
  }

  // Menu chiptune — calmer than title, still melodic. 100 bpm, softer.
  playMenu() {
    if (!this.enabled) return;
    if (this.playing && this.currentTrack === 'menu') return;
    this.stop();
    this._ensure();
    this.playing = true;
    this.currentTrack = 'menu';
    this._loopMenu();
  }

  _loopMenu() {
    if (!this.playing || this.currentTrack !== 'menu') return;
    const ctx = this._ensure();
    const bpm = 100;
    const beat = 60 / bpm / 2;
    let t = ctx.currentTime + 0.1;
    // 32-note C-major gentle arc, space for the title's attention.
    const mel = [
      523, null, 659, null, 784, null, 880, null,
      784, null, 659, null, 587, null, 523, null,
      440, null, 523, null, 659, null, 784, null,
      659, null, 523, null, 494, null, 440, null,
    ];
    const bas = [
      262, 262, null, null, 196, 196, null, null,
      262, 262, null, null, 196, 196, null, null,
      220, 220, null, null, 165, 165, null, null,
      262, 262, null, null, 196, 196, null, null,
    ];
    for (let i = 0; i < 32; i++) {
      if (mel[i]) this._playNote(mel[i], t + i * beat, beat * 1.6, 'square', 0.04);
      if (bas[i]) this._playNote(bas[i], t + i * beat, beat * 1.7, 'triangle', 0.035);
      if (i % 8 === 0) this._playTick(t + i * beat, 0.03);
    }
    const dur = 32 * beat;
    this._phraseTimeout = setTimeout(() => this._loopMenu(), (dur - 0.05) * 1000);
  }
}

export const music = new MusicEngine();
