// Tier 0: minimal FSM (PLAYING / GOAL_PAUSE / RESULT). MainMenu/CharSelect/etc in Tier 1.

import { tuning } from '../tuning.js';

export const PHASE = {
  PLAYING:    'playing',
  GOAL_PAUSE: 'goal-pause',
  RESULT:     'result',
};

export class MatchState {
  constructor({ bus }) {
    this._bus = bus;
    this.phase = PHASE.PLAYING;
    this.scores = { p1: 0, p2: 0 };
    this.timeRemaining = tuning.match.durationSec;
    this._goalPauseUntil = 0;

    bus.on('goal-scored', ({ playerId }) => this._onGoal(playerId));
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
    if (this.phase === PHASE.PLAYING) {
      this.timeRemaining = Math.max(0, this.timeRemaining - dt);
      if (this.timeRemaining === 0) {
        this.phase = PHASE.RESULT;
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
    this.phase = PHASE.PLAYING;
    this._bus.emit('score-changed', { ...this.scores });
    this._bus.emit('match-reset');
  }
}
