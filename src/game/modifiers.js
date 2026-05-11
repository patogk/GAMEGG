// Modifier catalog. Per ADR-003: modifiers are Physics plugins with a frozen
// 3-hook surface (onPreIntegrate/onPostIntegrate/onCollisionResolve), plus an
// optional apply/unapply pair for structural changes (radius/goal swap) that
// only happen at match boundaries.
//
// Cap: 1 active modifier per match (per PR-SCOPE).

import { tuning } from '../tuning.js';
import { LAYER } from './collision.js';

export const MODIFIERS = [
  { id: 'none',         name: 'NORMAL',     emoji: '○', description: 'Partida normal' },
  { id: 'low-gravity',  name: 'GRAV. LUNAR', emoji: '🌙', description: 'Gravedad al 30%' },
  { id: 'giant-ball',   name: 'BALÓN GIGANTE', emoji: '🔵', description: 'Balón 2x tamaño' },
  { id: 'tiny-goal',    name: 'ARCO CHICO', emoji: '▭', description: 'Porterías 60%' },
];

// ──────────────────────────────────────────────────────────────
export class ModifierSystem {
  constructor({ physics, collision, ball, bus }) {
    this._physics = physics;
    this._collision = collision;
    this._ball = ball;
    this._bus = bus;
    this._active = null;     // { id, plugin?, applied?:bool }
    this._origBallRadius = tuning.ball.radius;
    this._origGoalYTop = null;   // set at first activation
  }

  setActive(id) {
    if (this._active) this.clear();
    if (!id || id === 'none') { this._active = null; return; }
    const def = MODIFIERS.find((m) => m.id === id);
    if (!def) { console.warn('Unknown modifier', id); return; }
    this._active = { id, def };
    this._apply(id);
    this._bus.emit('modifier-applied', { id, name: def.name });
  }

  clear() {
    if (!this._active) return;
    this._unapply(this._active.id);
    this._active = null;
    this._bus.emit('modifier-cleared');
  }

  get active() { return this._active?.id ?? 'none'; }
  get activeDef() { return this._active?.def ?? MODIFIERS[0]; }

  // ──────────────────────────────────────────────────────────────
  _apply(id) {
    switch (id) {
      case 'low-gravity': {
        const plugin = {
          name: 'low-gravity',
          onPreIntegrate: (e) => { e.gravityScale = 0.35; },
        };
        this._active.plugin = plugin;
        this._physics.registerModifier(plugin);
        break;
      }
      case 'giant-ball': {
        // Apply at match boundary: mutate ball.radius.
        this._origBallRadius = this._ball.radius;
        this._ball.radius = this._origBallRadius * 2;
        break;
      }
      case 'tiny-goal': {
        // Shrink the goal sensor + crossbar from the top (smaller opening).
        const shrinkPx = tuning.field.goalHeight * 0.4;
        for (const g of this._collision._goals) {
          if (this._origGoalYTop === null) this._origGoalYTop = g.yTop;
          g.yTop = g.yTop + shrinkPx;
        }
        break;
      }
    }
  }

  _unapply(id) {
    switch (id) {
      case 'low-gravity':
        if (this._active.plugin) this._physics.unregisterModifier(this._active.plugin);
        break;
      case 'giant-ball':
        this._ball.radius = this._origBallRadius;
        break;
      case 'tiny-goal':
        if (this._origGoalYTop !== null) {
          for (const g of this._collision._goals) g.yTop = this._origGoalYTop;
          this._origGoalYTop = null;
        }
        break;
    }
  }
}

// ──────────────────────────────────────────────────────────────
export function pickRandomModifier() {
  // Pick from the non-'none' pool weighted equally (for now).
  const pool = MODIFIERS.filter((m) => m.id !== 'none');
  return pool[Math.floor(Math.random() * pool.length)].id;
}
