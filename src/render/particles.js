// Particle pool capped at 50 (per perf budget). Drawable contract.
// Spawns hit-sparks, ball-trails, goal-explosions.

import { tuning } from '../tuning.js';

const MAX = 50;

export class ParticleSystem {
  constructor({ bus }) {
    this._bus = bus;
    this.zOrder = 25;
    this.visible = true;
    this._renderCtx = null;

    // Flat pool: arrays of typed properties for tight loops
    this._x = new Float32Array(MAX);
    this._y = new Float32Array(MAX);
    this._vx = new Float32Array(MAX);
    this._vy = new Float32Array(MAX);
    this._life = new Float32Array(MAX);   // remaining sec
    this._maxLife = new Float32Array(MAX);
    this._r = new Float32Array(MAX);
    this._color = new Array(MAX);          // 'cyan'|'magenta'|'white'|'yellow'|'lime'
    this._active = new Uint8Array(MAX);
    this._lastTickMs = performance.now();

    bus.on('ball-hit-head', ({ playerId, hitVelocity }) => {
      const color = playerId === 'p1' ? 'cyan' : 'magenta';
      const n = Math.min(8, 3 + Math.floor((hitVelocity ?? 600) / 200));
      this._spawnBurst(this._lastHit?.x ?? 0, this._lastHit?.y ?? 0, color, n, 220);
    });
    bus.on('goal-scored', () => {
      // big lime explosion at field center
      this._spawnBurst(tuning.field.centerX, tuning.field.centerY, 'lime', 20, 350);
    });
  }

  // External hint so we know where ball was on hit (set by main.js wiring)
  noteBallPosition(x, y) { this._lastHit = { x, y }; }

  setRenderContext(rc) { this._renderCtx = rc; }

  _spawnBurst(x, y, color, n, speed) {
    for (let i = 0; i < n; i++) this._spawnOne(x, y, color, speed);
  }

  _spawnOne(x, y, color, speed) {
    // find free slot
    let idx = -1;
    for (let i = 0; i < MAX; i++) { if (!this._active[i]) { idx = i; break; } }
    if (idx === -1) {
      // pool full → recycle the oldest (shortest life remaining)
      let minLife = Infinity, minIdx = 0;
      for (let i = 0; i < MAX; i++) if (this._life[i] < minLife) { minLife = this._life[i]; minIdx = i; }
      idx = minIdx;
    }
    const angle = Math.random() * Math.PI * 2;
    const v = speed * (0.5 + Math.random() * 0.5);
    this._x[idx] = x; this._y[idx] = y;
    this._vx[idx] = Math.cos(angle) * v;
    this._vy[idx] = Math.sin(angle) * v;
    const life = 0.35 + Math.random() * 0.35;
    this._life[idx] = life;
    this._maxLife[idx] = life;
    this._r[idx] = 2 + Math.random() * 4;
    this._color[idx] = color;
    this._active[idx] = 1;
  }

  update(dt) {
    for (let i = 0; i < MAX; i++) {
      if (!this._active[i]) continue;
      this._life[i] -= dt;
      if (this._life[i] <= 0) { this._active[i] = 0; continue; }
      this._x[i] += this._vx[i] * dt;
      this._y[i] += this._vy[i] * dt;
      this._vx[i] *= 0.95;
      this._vy[i] = this._vy[i] * 0.95 + 600 * dt; // light gravity for fall
    }
  }

  draw(ctx) {
    const colorMap = {
      cyan: tuning.colors.p1Cyan, magenta: tuning.colors.p2Magenta,
      white: tuning.colors.ballWhite, lime: tuning.colors.goalLime,
      yellow: tuning.colors.impactYellow,
    };
    const prev = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < MAX; i++) {
      if (!this._active[i]) continue;
      const k = this._life[i] / this._maxLife[i]; // 1 → 0
      ctx.fillStyle = colorMap[this._color[i]] || '#fff';
      ctx.globalAlpha = k;
      ctx.beginPath();
      ctx.arc(this._x[i], this._y[i], this._r[i] * (0.5 + k * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = prev;
  }
}
