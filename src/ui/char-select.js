// CharacterSelect: two columns (P1 left, P2 right), navigate L/R, confirm with jump.
// Modifier roulette below: spins for 2s then locks on random pick.
// When both players confirmed, transition to COUNTDOWN.

import { tuning } from '../tuning.js';
import { PHASE } from '../game/match-state.js';
import { CHARACTERS } from '../game/characters.js';
import { MODIFIERS, pickRandomModifier } from '../game/modifiers.js';

export class CharacterSelect {
  constructor({ matchState, bus, audioPlayer }) {
    this._matchState = matchState;
    this._bus = bus;
    this._audio = audioPlayer;
    this.zOrder = 49;

    this._cursor = { p1: 0, p2: 1 };
    this._confirmed = { p1: false, p2: false };
    this._rouletteStartedAt = 0;
    this._rouletteFinal = null;
    this._rouletteCurrent = null;
    this._rouletteSpinIntervalMs = 70;

    // Input — only act when in CHAR_SELECT phase
    bus.on('p1-move-left-pressed',  () => this._move('p1', -1));
    bus.on('p1-move-right-pressed', () => this._move('p1', +1));
    bus.on('p2-move-left-pressed',  () => this._move('p2', -1));
    bus.on('p2-move-right-pressed', () => this._move('p2', +1));
    bus.on('p1-jump-pressed',       () => this._confirm('p1'));
    bus.on('p2-jump-pressed',       () => this._confirm('p2'));
  }

  get visible() { return this._matchState.phase === PHASE.CHAR_SELECT; }

  enter() {
    this._cursor.p1 = 0;
    this._cursor.p2 = 1;
    this._confirmed.p1 = false;
    this._confirmed.p2 = false;
    this._rouletteStartedAt = performance.now();
    this._rouletteFinal = pickRandomModifier();
    this._rouletteCurrent = null;
  }

  _move(pid, dir) {
    if (this._matchState.phase !== PHASE.CHAR_SELECT) return;
    if (this._confirmed[pid]) return;
    const n = CHARACTERS.length;
    this._cursor[pid] = (this._cursor[pid] + dir + n) % n;
  }

  _confirm(pid) {
    if (this._matchState.phase !== PHASE.CHAR_SELECT) return;
    if (this._confirmed[pid]) return;
    this._confirmed[pid] = true;
    // commit selection so MatchState knows
    const selection = {};
    selection[pid] = CHARACTERS[this._cursor[pid]].id;
    this._matchState.setSelection(selection);
    this._bus.emit('char-confirmed', { playerId: pid });

    if (this._confirmed.p1 && this._confirmed.p2) {
      // commit modifier (locked already from roulette)
      this._matchState.setSelection({ modifier: this._rouletteFinal });
      this._bus.emit('selections-finalized', {
        p1: this._matchState.selection.p1,
        p2: this._matchState.selection.p2,
        modifier: this._rouletteFinal,
      });
    }
  }

  draw(ctx, t) {
    const w = tuning.field.width;
    const h = tuning.field.height;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);

    // title
    ctx.font = 'bold 40px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = tuning.colors.uiText;
    ctx.fillText('ELIGE TU CABEZÓN', w/2, 60);

    // two columns
    const colW = w / 2;
    this._drawColumn(ctx, 'p1', colW * 0.5, h * 0.5, t);
    this._drawColumn(ctx, 'p2', colW * 1.5, h * 0.5, t);

    // modifier roulette
    this._updateRoulette(t);
    this._drawRoulette(ctx, w / 2, h - 130, t);

    // bottom hint
    ctx.font = '14px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = tuning.colors.uiTextDim;
    ctx.textAlign = 'center';
    ctx.fillText('← → para escoger · ↑ / W para confirmar', w/2, h - 30);
  }

  _drawColumn(ctx, pid, cx, cy, t) {
    const accent = pid === 'p1' ? tuning.colors.p1Cyan : tuning.colors.p2Magenta;
    const idx = this._cursor[pid];
    const ch = CHARACTERS[idx];
    const confirmed = this._confirmed[pid];

    // header
    ctx.font = 'bold 22px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText(pid.toUpperCase(), cx, cy - 170);

    // character circle preview
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx, cy - 70, 48, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cx - 16, cy - 78, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 16, cy - 78, 6, 0, Math.PI * 2); ctx.fill();
    // mouth
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath();
    if (ch.mouthShape === 'smile') ctx.arc(cx, cy - 60, 18, 0.2 * Math.PI, 0.8 * Math.PI);
    else { ctx.moveTo(cx - 16, cy - 50); ctx.lineTo(cx + 16, cy - 50); }
    ctx.stroke();

    // name + special
    ctx.font = 'bold 28px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = tuning.colors.uiText;
    ctx.fillText(ch.name, cx, cy + 10);
    ctx.font = '16px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = tuning.colors.uiTextDim;
    ctx.fillText(`special · ${ch.specialName}`, cx, cy + 40);

    // arrows (pulsing) — hidden after confirm
    if (!confirmed) {
      const pulse = 0.5 + 0.5 * Math.sin(t / 250);
      ctx.font = 'bold 32px "Space Grotesk", system-ui, sans-serif';
      ctx.fillStyle = `rgba(232,241,255,${(0.3 + 0.6 * pulse).toFixed(2)})`;
      ctx.fillText('‹    ›', cx, cy + 80);
    } else {
      ctx.font = 'bold 26px "Space Grotesk", system-ui, sans-serif';
      ctx.fillStyle = tuning.colors.goalLime;
      ctx.fillText('✓ LISTO', cx, cy + 80);
    }
  }

  _updateRoulette(tNow) {
    const elapsed = tNow - this._rouletteStartedAt;
    const spinDurMs = 2000;
    if (elapsed >= spinDurMs) {
      this._rouletteCurrent = this._rouletteFinal;
      return;
    }
    // ease-out: fast at first, slows down
    const intervalNow = this._rouletteSpinIntervalMs * (1 + elapsed / 200);
    const step = Math.floor(elapsed / intervalNow);
    const pool = MODIFIERS.filter((m) => m.id !== 'none');
    this._rouletteCurrent = pool[step % pool.length].id;
  }

  _drawRoulette(ctx, cx, cy, t) {
    const def = MODIFIERS.find((m) => m.id === this._rouletteCurrent) ?? MODIFIERS[0];
    const elapsed = t - this._rouletteStartedAt;
    const locked = elapsed >= 2000;

    ctx.font = 'bold 16px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = tuning.colors.uiTextDim;
    ctx.textAlign = 'center';
    ctx.fillText('MODIFICADOR', cx, cy - 38);

    // chip background
    const chipW = 320;
    const chipH = 56;
    const chipX = cx - chipW / 2;
    const chipY = cy - chipH / 2;
    ctx.fillStyle = locked ? 'rgba(157,43,255,0.25)' : 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = locked ? tuning.colors.modifierViolet : tuning.colors.uiTextDim;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(chipX, chipY, chipW, chipH, 8);
    ctx.fill(); ctx.stroke();

    ctx.font = 'bold 24px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = tuning.colors.uiText;
    ctx.fillText(`${def.emoji}  ${def.name}`, cx, cy);
  }
}
