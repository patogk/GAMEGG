// GameLoop owns timeScale (per TD-SYSTEM-BOUNDARY concern #1).
// Fixed timestep accumulator; drives update sub-steps + variable render rate.

import { tuning } from '../tuning.js';

export class GameLoop {
  constructor() {
    this._running = false;
    this._lastNow = 0;
    this._accumulator = 0;
    this._timeScale = 1;
    this._slowmoEndAt = 0;
    this._slowmoTarget = 1;
    this._hitstopUntil = 0;
    this._update = null;
    this._render = null;
    this._rafId = 0;
    this._frame = this._frame.bind(this);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._lastNow = 0;
        this._accumulator = 0;
      } else {
        this._lastNow = performance.now();
      }
    });
  }

  start(updateFn, renderFn) {
    this._update = updateFn;
    this._render = renderFn;
    this._lastNow = performance.now();
    this._running = true;
    this._rafId = requestAnimationFrame(this._frame);
  }

  stop() {
    this._running = false;
    cancelAnimationFrame(this._rafId);
  }

  setTimeScale(target, durationMs) {
    this._timeScale = target;
    this._slowmoTarget = target;
    this._slowmoEndAt = performance.now() + durationMs;
  }

  pulseHitstop(ms) {
    this._hitstopUntil = performance.now() + ms;
  }

  getTimeScale() { return this._timeScale; }

  _frame(now) {
    if (!this._running) return;
    this._rafId = requestAnimationFrame(this._frame);

    if (this._lastNow === 0) { this._lastNow = now; return; }
    const frameDelta = Math.min(now - this._lastNow, tuning.loop.maxFrameDeltaMs);
    this._lastNow = now;

    // Slow-mo ramp-out
    if (this._slowmoEndAt > 0) {
      const remaining = this._slowmoEndAt - now;
      if (remaining <= 0) { this._timeScale = 1; this._slowmoEndAt = 0; }
      else if (remaining < tuning.loop.slowmoRampOutMs) {
        const k = 1 - remaining / tuning.loop.slowmoRampOutMs;
        this._timeScale = this._slowmoTarget + (1 - this._slowmoTarget) * k;
      }
    }

    // Hitstop: skip update sub-steps but still render
    const inHitstop = now < this._hitstopUntil;
    if (!inHitstop) {
      this._accumulator += frameDelta * this._timeScale;
      const fixedMs = tuning.loop.fixedDtMs;
      const fixedS  = fixedMs / 1000;
      let steps = 0;
      while (this._accumulator >= fixedMs && steps < tuning.loop.maxSubSteps) {
        this._update(fixedS);
        this._accumulator -= fixedMs;
        steps++;
      }
      if (steps === tuning.loop.maxSubSteps) this._accumulator = 0; // drop excess
    }

    const alpha = inHitstop ? 0 : (this._accumulator / tuning.loop.fixedDtMs);
    this._render(alpha, now);
  }
}
