// Renderer with Drawable contract (per ADR-002). Knows nothing about game types.

import { tuning } from '../tuning.js';

export class Renderer {
  constructor({ ctxWrap, bus }) {
    this._ctxWrap = ctxWrap;
    this._bus = bus;
    this._drawables = [];
    this._dirty = false;
    this._goalFlashEndAt = 0;

    bus.on('goal-scored', () => {
      this._goalFlashEndAt = performance.now() + tuning.render.goalFlashDurationMs;
    });
  }

  register(drawable) {
    if (typeof drawable.draw !== 'function') throw new Error('Drawable missing draw()');
    if (typeof drawable.zOrder !== 'number') drawable.zOrder = 10;
    if (typeof drawable.visible !== 'boolean') drawable.visible = true;
    if (typeof drawable.setRenderContext === 'function') drawable.setRenderContext(this._ctxWrap);
    this._drawables.push(drawable);
    this._dirty = true;
  }

  unregister(drawable) {
    const i = this._drawables.indexOf(drawable);
    if (i >= 0) this._drawables.splice(i, 1);
  }

  render(alpha, t) {
    const ctx = this._ctxWrap.ctx;
    const w = this._ctxWrap.width();
    const h = this._ctxWrap.height();

    if (this._dirty) {
      this._drawables.sort((a, b) => a.zOrder - b.zOrder);
      this._dirty = false;
    }

    // Clear (full screen, no shake offset)
    ctx.fillStyle = tuning.render.bgBlack;
    ctx.fillRect(0, 0, w, h);

    // Screen shake: translate the world after clearing
    const [sx, sy] = this._ctxWrap.consumeShakeOffset();
    if (sx !== 0 || sy !== 0) ctx.translate(sx, sy);

    // Field lines (faint guides)
    ctx.strokeStyle = tuning.colors.fieldLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, tuning.field.floorY);
    ctx.moveTo(0, tuning.field.floorY); ctx.lineTo(w, tuning.field.floorY);
    ctx.stroke();

    // Drawables
    for (const d of this._drawables) {
      if (!d.visible) continue;
      ctx.save();
      try { d.draw(ctx, t, alpha); }
      catch (err) { console.error('Drawable draw error', d, err); }
      ctx.restore();
    }

    // Undo shake translate so the flash overlay covers full screen
    if (sx !== 0 || sy !== 0) ctx.translate(-sx, -sy);

    // Goal flash overlay
    const now = performance.now();
    if (now < this._goalFlashEndAt) {
      const k = Math.max(0, (this._goalFlashEndAt - now) / tuning.render.goalFlashDurationMs);
      const a = k * tuning.render.goalFlashMaxAlpha;
      ctx.fillStyle = `rgba(166, 255, 0, ${a.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }
}
