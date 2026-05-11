// ResultScreen — visible during RESULT phase. Shows winner card + revancha prompt.

import { tuning } from '../tuning.js';
import { PHASE } from '../game/match-state.js';
import { getCharacterById } from '../game/characters.js';

export class ResultScreen {
  constructor({ matchState, bus }) {
    this._matchState = matchState;
    this._bus = bus;
    this.zOrder = 49;

    // R = revancha (back to CHAR_SELECT with same selection), Esc = main menu
    bus.on('restart-pressed', () => {
      if (this._matchState.phase === PHASE.RESULT) {
        this._bus.emit('rematch-requested');
      }
    });
    bus.on('pause-pressed', () => {
      if (this._matchState.phase === PHASE.RESULT) {
        this._bus.emit('back-to-menu-requested');
      }
    });
  }

  get visible() { return this._matchState.phase === PHASE.RESULT; }

  draw(ctx, t) {
    const w = tuning.field.width;
    const h = tuning.field.height;
    const ms = this._matchState;
    const winner = ms.winner;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let title, winColor;
    if (winner === 'p1')      { title = '¡P1 GANÓ!'; winColor = tuning.colors.p1Cyan; }
    else if (winner === 'p2') { title = '¡P2 GANÓ!'; winColor = tuning.colors.p2Magenta; }
    else                       { title = 'EMPATE';   winColor = tuning.colors.uiText; }

    // Big winner title with double-stroke
    ctx.font = 'bold 96px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = winColor;
    ctx.fillText(title, w/2 - 3, h/2 - 100);
    ctx.fillText(title, w/2 + 3, h/2 - 100);
    ctx.fillStyle = tuning.colors.uiText;
    ctx.fillText(title, w/2, h/2 - 100);

    // Scoreline
    ctx.font = 'bold 48px ui-monospace, "JetBrains Mono", monospace';
    ctx.fillStyle = tuning.colors.p1Cyan;
    ctx.textAlign = 'right';
    ctx.fillText(String(ms.scores.p1), w/2 - 30, h/2);
    ctx.fillStyle = tuning.colors.uiTextDim;
    ctx.textAlign = 'center';
    ctx.fillText('—', w/2, h/2);
    ctx.fillStyle = tuning.colors.p2Magenta;
    ctx.textAlign = 'left';
    ctx.fillText(String(ms.scores.p2), w/2 + 30, h/2);

    // Character name taunt (if there's a winner)
    if (winner) {
      const ch = getCharacterById(ms.selection[winner]);
      ctx.font = 'italic 20px "Space Grotesk", system-ui, sans-serif';
      ctx.fillStyle = tuning.colors.uiTextDim;
      ctx.textAlign = 'center';
      ctx.fillText(`${ch.name}: "${ch.taunt}"`, w/2, h/2 + 60);
    }

    // Prompts (pulsing)
    const k = 0.5 + 0.5 * Math.sin(t / 350);
    ctx.font = 'bold 22px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = `rgba(232,241,255,${(0.4 + 0.6 * k).toFixed(2)})`;
    ctx.textAlign = 'center';
    ctx.fillText('R · REVANCHA       ESC · MENÚ', w/2, h/2 + 130);
  }
}
