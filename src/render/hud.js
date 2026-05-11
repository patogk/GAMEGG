// HUD — visible during gameplay phases. Score + timer + special cooldown bars +
// active modifier indicator + countdown overlay.

import { tuning } from '../tuning.js';
import { PHASE } from '../game/match-state.js';
import { getCharacterById } from '../game/characters.js';
import { MODIFIERS } from '../game/modifiers.js';

export class HUD {
  constructor({ matchState, p1, p2 }) {
    this._matchState = matchState;
    this._p1 = p1;
    this._p2 = p2;
    this.zOrder = 45;
  }

  get visible() {
    const ph = this._matchState.phase;
    return ph === PHASE.PLAYING || ph === PHASE.GOAL_PAUSE || ph === PHASE.COUNTDOWN;
  }

  draw(ctx, t) {
    const w = tuning.field.width;
    const h = tuning.field.height;
    const ms = this._matchState;

    // Top center: scores + timer
    ctx.font = 'bold 56px ui-monospace, "JetBrains Mono", "Courier New", monospace';
    ctx.textBaseline = 'top';

    ctx.fillStyle = tuning.colors.p1Cyan;
    ctx.textAlign = 'right';
    ctx.fillText(String(ms.scores.p1), w/2 - 90, 24);

    const tSec = Math.ceil(ms.timeRemaining);
    ctx.fillStyle = (tSec <= 10 && ms.phase === PHASE.PLAYING && Math.floor(t / 250) % 2 === 0)
      ? tuning.colors.impactYellow
      : tuning.colors.uiText;
    ctx.textAlign = 'center';
    ctx.fillText(String(tSec).padStart(2, '0'), w/2, 24);

    ctx.fillStyle = tuning.colors.p2Magenta;
    ctx.textAlign = 'left';
    ctx.fillText(String(ms.scores.p2), w/2 + 90, 24);

    // Character names below score
    if (this._p1) this._drawCharCard(ctx, this._p1, ms.selection.p1, w/2 - 230, 36, 'right');
    if (this._p2) this._drawCharCard(ctx, this._p2, ms.selection.p2, w/2 + 230, 36, 'left');

    // Active modifier indicator (top)
    const mod = MODIFIERS.find((m) => m.id === ms.selection.modifier);
    if (mod && mod.id !== 'none') {
      ctx.font = 'bold 14px "Space Grotesk", system-ui, sans-serif';
      ctx.fillStyle = tuning.colors.modifierViolet;
      ctx.textAlign = 'center';
      ctx.fillText(`${mod.emoji} ${mod.name}`, w/2, 92);
    }

    // Special cooldown bars (bottom corners)
    if (this._p1) this._drawCooldownBar(ctx, this._p1, 24, h - 40, 200, 'right', tuning.colors.p1Cyan);
    if (this._p2) this._drawCooldownBar(ctx, this._p2, w - 24, h - 40, 200, 'left', tuning.colors.p2Magenta);

    // Phase prompts
    if (ms.phase === PHASE.GOAL_PAUSE) {
      ctx.fillStyle = tuning.colors.goalLime;
      ctx.font = 'bold 96px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('¡GOL!', w/2, h/2 - 60);
    } else if (ms.phase === PHASE.COUNTDOWN) {
      ctx.fillStyle = tuning.colors.uiText;
      ctx.font = 'bold 160px "Space Grotesk", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const v = ms.countdownValue;
      ctx.fillText(v > 0 ? String(v) : '¡VA!', w/2, h/2);
    }
  }

  _drawCharCard(ctx, player, charId, x, y, align, _accent) {
    const ch = getCharacterById(charId);
    ctx.font = 'bold 18px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = tuning.colors.uiTextDim;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillText(ch.name, x, y);
  }

  _drawCooldownBar(ctx, player, x, y, width, align, color) {
    const now = performance.now();
    const cdEnd = player.specialCooldownEndsAt ?? 0;
    const remaining = Math.max(0, cdEnd - now);
    const total = tuning.player.specialCooldownMs;
    const ready = remaining <= 0;
    const fill = ready ? 1 : (1 - remaining / total);

    const barX = align === 'right' ? x : (x - width);
    // bg
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(barX, y, width, 8);
    // fill
    ctx.fillStyle = ready ? tuning.colors.goalLime : color;
    ctx.fillRect(barX, y, width * fill, 8);
    // label
    ctx.font = 'bold 12px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = ready ? tuning.colors.goalLime : tuning.colors.uiTextDim;
    ctx.textAlign = align;
    ctx.textBaseline = 'bottom';
    const label = ready ? '⚡ SPECIAL LISTO' : 'special…';
    ctx.fillText(label, align === 'right' ? (barX + width) : barX, y - 4);
  }
}

// Add roundRect polyfill if needed (browser only)
if (typeof CanvasRenderingContext2D !== 'undefined'
 && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    this.beginPath();
    this.moveTo(x + r[0], y);
    this.lineTo(x + w - r[1], y);
    this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    this.lineTo(x + w, y + h - r[2]);
    this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    this.lineTo(x + r[3], y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    this.lineTo(x, y + r[0]);
    this.quadraticCurveTo(x, y, x + r[0], y);
    return this;
  };
}
