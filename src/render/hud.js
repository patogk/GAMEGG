// HUD — implements Drawable. Shows scores + timer + phase prompt.

import { tuning } from '../tuning.js';
import { PHASE } from '../game/match-state.js';

export class HUD {
  constructor({ matchState }) {
    this._matchState = matchState;
    this.zOrder = 45;
    this.visible = true;
  }

  draw(ctx) {
    const w = tuning.field.width;
    const ms = this._matchState;

    // Top center: score + timer
    ctx.font = 'bold 56px ui-monospace, "JetBrains Mono", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // P1 score (cyan)
    ctx.fillStyle = tuning.colors.p1Cyan;
    ctx.textAlign = 'right';
    ctx.fillText(String(ms.scores.p1), w / 2 - 90, 24);

    // Timer (white)
    const t = Math.ceil(ms.timeRemaining);
    ctx.fillStyle = (t <= 10 && ms.phase === PHASE.PLAYING && Math.floor(performance.now() / 250) % 2 === 0)
      ? tuning.colors.impactYellow
      : tuning.colors.uiText;
    ctx.textAlign = 'center';
    ctx.fillText(String(t).padStart(2, '0'), w / 2, 24);

    // P2 score (magenta)
    ctx.fillStyle = tuning.colors.p2Magenta;
    ctx.textAlign = 'left';
    ctx.fillText(String(ms.scores.p2), w / 2 + 90, 24);

    // Phase prompts
    if (ms.phase === PHASE.GOAL_PAUSE) {
      ctx.fillStyle = tuning.colors.goalLime;
      ctx.font = 'bold 96px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡GOL!', w / 2, tuning.field.height / 2 - 60);
    } else if (ms.phase === PHASE.RESULT) {
      ctx.fillStyle = tuning.colors.uiText;
      ctx.font = 'bold 80px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      let msg;
      if (ms.scores.p1 > ms.scores.p2)      msg = '¡P1 GANÓ!';
      else if (ms.scores.p2 > ms.scores.p1) msg = '¡P2 GANÓ!';
      else                                   msg = 'EMPATE';
      ctx.fillText(msg, w / 2, tuning.field.height / 2 - 80);
      ctx.font = '24px "Space Grotesk", system-ui, sans-serif';
      ctx.fillStyle = tuning.colors.uiTextDim;
      ctx.fillText('Presiona R para revancha', w / 2, tuning.field.height / 2 + 20);
    }

    // Bottom-left controls hint (Tier 0 helper)
    ctx.font = '14px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = tuning.colors.uiTextDim;
    ctx.fillText('P1: A D mover · W saltar', 16, tuning.field.height - 36);
    ctx.textAlign = 'right';
    ctx.fillText('P2: ← → mover · ↑ saltar', tuning.field.width - 16, tuning.field.height - 36);
  }
}
