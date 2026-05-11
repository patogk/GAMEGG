// Wraps the <canvas>, owns viewport + DPR scaling + cached glow sprites.

import { tuning } from '../tuning.js';

const GLOW_COLORS = {
  cyan:    tuning.colors.p1Cyan,
  magenta: tuning.colors.p2Magenta,
  white:   tuning.colors.ballWhite,
  yellow:  tuning.colors.impactYellow,
  orange:  tuning.colors.specialOrange,
  lime:    tuning.colors.goalLime,
  violet:  tuning.colors.modifierViolet,
};

const GLOW_RADII = [16, 24, 32, 48, 64, 96];

export class RenderContext {
  constructor({ canvas }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._glowCache = new Map(); // `${color}-${r}` → offscreen canvas
    this._shake = { amplitude: 0, endsAt: 0, totalMs: 0 };
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._buildGlowCache();
  }

  setShake(amplitudePx, durationMs) {
    // strongest of any active shake wins
    const now = performance.now();
    if (amplitudePx >= this._shake.amplitude || now >= this._shake.endsAt) {
      this._shake.amplitude = amplitudePx;
      this._shake.endsAt = now + durationMs;
      this._shake.totalMs = durationMs;
    }
  }

  consumeShakeOffset() {
    const now = performance.now();
    if (now >= this._shake.endsAt || this._shake.amplitude <= 0) return [0, 0];
    const remaining = this._shake.endsAt - now;
    const k = remaining / this._shake.totalMs; // 1 → 0
    const amp = this._shake.amplitude * k;
    return [(Math.random() * 2 - 1) * amp, (Math.random() * 2 - 1) * amp];
  }

  _resize() {
    const aspect = tuning.render.fieldAspect;
    const wCss = window.innerWidth;
    const hCss = window.innerHeight;
    let w, h;
    if (wCss / hCss > aspect) { h = hCss; w = h * aspect; }
    else                       { w = wCss; h = w / aspect; }
    this.canvas.style.width  = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width  = Math.floor(tuning.field.width  * this._dpr);
    this.canvas.height = Math.floor(tuning.field.height * this._dpr);
    this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
  }

  _buildGlowCache() {
    for (const [name, color] of Object.entries(GLOW_COLORS)) {
      for (const r of GLOW_RADII) {
        const size = r * 2;
        const off = document.createElement('canvas');
        off.width = size; off.height = size;
        const c = off.getContext('2d');
        const g = c.createRadialGradient(r, r, 0, r, r, r);
        const hex = color.replace('#', '');
        g.addColorStop(0,   `#${hex}FF`);
        g.addColorStop(0.4, `#${hex}80`);
        g.addColorStop(1,   `#${hex}00`);
        c.fillStyle = g;
        c.fillRect(0, 0, size, size);
        this._glowCache.set(`${name}-${r}`, off);
      }
    }
  }

  glow(ctx, x, y, color, radius) {
    // round radius to nearest cached size
    let best = GLOW_RADII[0];
    for (const r of GLOW_RADII) { if (Math.abs(r - radius) < Math.abs(best - radius)) best = r; }
    const sprite = this._glowCache.get(`${color}-${best}`);
    if (!sprite) return;
    const prev = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(sprite, x - best, y - best);
    ctx.globalCompositeOperation = prev;
  }

  width()  { return tuning.field.width; }
  height() { return tuning.field.height; }
}
