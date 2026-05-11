// MatchState — extended FSM for Sprint 02.
// Phases: MENU → CHAR_SELECT → COUNTDOWN → PLAYING ↔ GOAL_PAUSE → RESULT → MENU

import { tuning } from '../tuning.js';

export const PHASE = {
  MENU:        'menu',
  CHAR_SELECT: 'char-select',
  COUNTDOWN:   'countdown',
  PLAYING:     'playing',
  GOAL_PAUSE:  'goal-pause',
  RESULT:      'result',
};

export class MatchState {
  constructor({ bus }) {
    this._bus = bus;
    this.phase = PHASE.MENU;
    this.scores = { p1: 0, p2: 0 };
    this.timeRemaining = tuning.match.durationSec;
    this.selection = { p1: 'spark', p2: 'jumpy', modifier: 'none' };
    this._goalPauseUntil = 0;
    this._countdownUntil = 0;
    this.countdownValue = 0;

    bus.on('goal-scored', ({ playerId }) => this._onGoal(playerId));
  }

  goto(phase) {
    if (this.phase === phase) return;
    const from = this.phase;
    this.phase = phase;
    this._bus.emit('phase-changed', { from, to: phase });

    if (phase === PHASE.COUNTDOWN) {
      this.timeRemaining = tuning.match.durationSec;
      this.scores.p1 = 0; this.scores.p2 = 0;
      this._countdownUntil = performance.now() + tuning.match.countdownMs;
    } else if (phase === PHASE.MENU) {
      this.timeRemaining = tuning.match.durationSec;
      this.scores.p1 = 0; this.scores.p2 = 0;
    }
  }

  setSelection({ p1, p2, modifier }) {
    if (p1) this.selection.p1 = p1;
    if (p2) this.selection.p2 = p2;
    if (modifier) this.selection.modifier = modifier;
    this._bus.emit('selection-changed', { ...this.selection });
  }

  _onGoal(playerId) {
    if (this.phase !== PHASE.PLAYING) return;
    this.scores[playerId]++;
    this._bus.emit('score-changed', { ...this.scores });
    this.phase = PHASE.GOAL_PAUSE;
    this._goalPauseUntil = performance.now() + tuning.collision.goalLockMs;
  }

  tick(dt) {
    const now = performance.now();
    if (this.phase === PHASE.COUNTDOWN) {
      const remaining = this._countdownUntil - now;
      this.countdownValue = Math.max(0, Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        this.goto(PHASE.PLAYING);
      }
    } else if (this.phase === PHASE.PLAYING) {
      this.timeRemaining = Math.max(0, this.timeRemaining - dt);
      if (this.timeRemaining === 0) {
        this.goto(PHASE.RESULT);
        this._bus.emit('match-end', { ...this.scores });
      }
    } else if (this.phase === PHASE.GOAL_PAUSE) {
      if (now >= this._goalPauseUntil) {
        this._bus.emit('ball-reset-requested');
        this.phase = PHASE.PLAYING;
      }
    }
  }

  reset() {
    this.scores.p1 = 0; this.scores.p2 = 0;
    this.timeRemaining = tuning.match.durationSec;
    this._bus.emit('score-changed', { ...this.scores });
    this._bus.emit('match-reset');
  }

  get winner() {
    if (this.scores.p1 > this.scores.p2) return 'p1';
    if (this.scores.p2 > this.scores.p1) return 'p2';
    return null;
  }
}
