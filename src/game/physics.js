// Semi-implicit Euler integrator. Per Physics GDD + ADR-003 modifier plugin contract.

import { tuning } from '../tuning.js';

export class Physics {
  constructor() {
    this._entities = new Set();
    this._modifiers = [];
  }

  registerEntity(e) { this._entities.add(e); }
  unregisterEntity(e) { this._entities.delete(e); }

  registerModifier(m) {
    if (typeof m.onPreIntegrate !== 'function'
     && typeof m.onPostIntegrate !== 'function'
     && typeof m.onCollisionResolve !== 'function') {
      throw new Error(`Modifier "${m.name}" implements no hooks`);
    }
    this._modifiers.push(m);
  }
  unregisterModifier(m) {
    const i = this._modifiers.indexOf(m);
    if (i >= 0) this._modifiers.splice(i, 1);
  }
  getModifiers() { return this._modifiers; }

  step(dt) {
    if (!(dt > 0)) return;
    const g = tuning.physics.gravity;
    const fricH = Math.pow(tuning.physics.airFriction, dt);
    const fricV = Math.pow(tuning.physics.airFrictionVertical, dt);
    const vMax = tuning.physics.maxVelocity;

    for (const e of this._entities) {
      // Pre-integrate hooks
      for (const m of this._modifiers) m.onPreIntegrate?.(e, dt);

      // Apply gravity
      const scale = e.gravityScale ?? 1;
      e.vy += g * scale * dt;

      // Air friction (framerate-independent)
      e.vx *= fricH;
      e.vy *= fricV;

      // Velocity cap
      if (e.vx >  vMax) e.vx =  vMax;
      if (e.vx < -vMax) e.vx = -vMax;
      if (e.vy >  vMax) e.vy =  vMax;
      if (e.vy < -vMax) e.vy = -vMax;

      // Save prev for renderer interpolation
      e.prevX = e.x; e.prevY = e.y;

      // Integrate position
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Post-integrate hooks
      for (const m of this._modifiers) m.onPostIntegrate?.(e, dt);

      // NaN guard
      if (!Number.isFinite(e.x) || !Number.isFinite(e.y)
       || !Number.isFinite(e.vx) || !Number.isFinite(e.vy)) {
        console.warn('Entity NaN — resetting velocity', e);
        e.vx = 0; e.vy = 0;
      }
    }
  }
}
