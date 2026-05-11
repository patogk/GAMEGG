// MainMenu screen — title + "press any key to start".
// Drawable. Visible only when matchState.phase === MENU.

import { tuning } from '../tuning.js';
import { PHASE } from '../game/match-state.js';

export class MainMenu {
  constructor({ matchState, bus }) {
    this._matchState = matchState;
    this._bus = bus;
    this.zOrder = 48;
  }

  get visible() { return this._matchState.phase === PHASE.MENU; }

  draw(ctx, t) {
    const w = tuning.field.width;
    const h = tuning.field.height;

    // dim overlay
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, h);

    // title with neon double-stroke
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const title = 'MEGA HEAD CUP';
    ctx.font = 'bold 88px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = tuning.colors.p1Cyan;
    ctx.fillText(title, w/2 - 4, h/2 - 80);
    ctx.fillStyle = tuning.colors.p2Magenta;
    ctx.fillText(title, w/2 + 4, h/2 - 80);
    ctx.fillStyle = tuning.colors.uiText;
    ctx.fillText(title, w/2, h/2 - 80);

    // subtitle
    ctx.font = '20px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = tuning.colors.uiTextDim;
    ctx.fillText('1v1 local · arcade soccer · pique de sofá', w/2, h/2 - 24);

    // press-any-key prompt (pulsing)
    const k = 0.5 + 0.5 * Math.sin(t / 350);
    ctx.font = 'bold 28px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = `rgba(232, 241, 255, ${(0.4 + 0.6 * k).toFixed(2)})`;
    ctx.fillText('PRESIONA CUALQUIER TECLA', w/2, h/2 + 60);

    // controls hint
    ctx.font = '14px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = tuning.colors.uiTextDim;
    ctx.fillText('P1: A D mover · W saltar · G special', w/2, h - 60);
    ctx.fillText('P2: ← → mover · ↑ saltar · , special', w/2, h - 40);
  }
}
