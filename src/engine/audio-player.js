// SFX via WebAudio oscillators + envelopes. No asset files — pure synthesis.
// Subscribes to gameplay events; ducks against the autoplay policy via AudioCtx.onReady.

export class AudioPlayer {
  constructor({ audioCtx, bus }) {
    this._audio = audioCtx;
    this._bus = bus;

    bus.on('goal-scored', () => this.play('goal'));
    bus.on('ball-hit-head', ({ hitVelocity }) => this.play('hit', { vel: hitVelocity }));
    bus.on('ball-hit-floor', ({ speed }) => { if (speed > 200) this.play('thud', { vel: speed }); });
    bus.on('ball-hit-wall', ({ speed }) => { if (speed > 200) this.play('thud', { vel: speed }); });
    bus.on('ball-hit-post', () => this.play('post'));
    bus.on('p1-jumped', () => this.play('jump'));
    bus.on('p2-jumped', () => this.play('jump', { detune: 80 }));
    bus.on('match-end', () => this.play('whistle'));
  }

  play(name, opts = {}) {
    if (!this._audio.isReady) return;
    const ctx = this._audio.ctx;
    const master = this._audio.master;
    const now = ctx.currentTime;

    switch (name) {
      case 'hit': {
        // sharp percussive click — noise + low sine
        const k = Math.min(1, (opts.vel ?? 600) / 1500);
        const dur = 0.06;
        const osc = ctx.createOscillator(); osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.6 + 0.4 * k, now + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + dur);
        // noise tap
        this._noiseBurst(0.04, 0.3 + 0.3 * k);
        break;
      }
      case 'thud': {
        const dur = 0.08;
        const osc = ctx.createOscillator(); osc.type = 'triangle';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.5, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + dur);
        break;
      }
      case 'post': {
        // metallic ping
        const dur = 0.25;
        const osc = ctx.createOscillator(); osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.25, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + dur);
        break;
      }
      case 'jump': {
        const dur = 0.12;
        const osc = ctx.createOscillator(); osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + dur);
        if (opts.detune) osc.detune.value = opts.detune;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + dur);
        break;
      }
      case 'goal': {
        // arpeggio: short rising chord
        const notes = [330, 415, 494, 660];
        notes.forEach((f, i) => {
          const t0 = now + i * 0.05;
          const dur = 0.4;
          const osc = ctx.createOscillator(); osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, t0);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          osc.connect(g); g.connect(master);
          osc.start(t0); osc.stop(t0 + dur);
        });
        break;
      }
      case 'whistle': {
        const dur = 0.6;
        const osc = ctx.createOscillator(); osc.type = 'square';
        osc.frequency.setValueAtTime(1800, now);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
        g.gain.linearRampToValueAtTime(0.15, now + dur - 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + dur);
        break;
      }
    }
  }

  _noiseBurst(durationS, gainPeak) {
    const ctx = this._audio.ctx;
    const sampleRate = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.floor(sampleRate * durationS), sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(); g.gain.value = gainPeak;
    src.connect(g); g.connect(this._audio.master);
    src.start();
  }
}
