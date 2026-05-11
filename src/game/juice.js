// JuiceController — owns hitstop + slow-mo + screen shake.
// Supersedes the inline 'goal-scored' subscriber in main.js (ADR-004 → superseded).
// Subscribes to gameplay events, commands GameLoop and RenderContext.

import { tuning } from '../tuning.js';

export class JuiceController {
  constructor({ bus, loop, ctxWrap }) {
    this._bus = bus;
    this._loop = loop;
    this._ctxWrap = ctxWrap;

    bus.on('goal-scored', () => {
      loop.pulseHitstop(tuning.juice.goalHitstopMs);
      // small delay so the freeze frame lands first
      setTimeout(() => loop.setTimeScale(tuning.juice.slowmoTarget, tuning.juice.goalSlowmoMs), tuning.juice.goalHitstopMs);
      ctxWrap.setShake(tuning.juice.goalShakePx, tuning.juice.goalShakeMs);
    });

    bus.on('ball-hit-head', ({ hitVelocity }) => {
      // shake intensity scales with hit velocity (clamped)
      const k = Math.min(1, hitVelocity / 1500);
      const shake = tuning.juice.hitShakeMinPx
                  + (tuning.juice.hitShakeMaxPx - tuning.juice.hitShakeMinPx) * k;
      ctxWrap.setShake(shake, tuning.juice.hitShakeMs);
    });

    bus.on('ball-hit-post', () => {
      // posts are crispy — always full shake
      ctxWrap.setShake(tuning.juice.postShakePx, tuning.juice.postShakeMs);
    });
  }
}
