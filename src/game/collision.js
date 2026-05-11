// Detection + resolution + goal-line + event emission. Per Collision GDD.
// Layers: HEAD=1, BALL=2, WALL=4, FLOOR=8, POST=16

import { tuning } from '../tuning.js';

export const LAYER = { HEAD: 1, BALL: 2, WALL: 4, FLOOR: 8, POST: 16 };

const STATIC_MASS = Infinity;

export class Collision {
  constructor({ bus }) {
    this._bus = bus;
    this._circles = new Set();
    this._aabbs = new Set();
    this._goals = []; // { side: 'left'|'right', x, yTop, yBottom, scoringPlayerId }
    this._goalLockedUntil = 0;
  }

  registerCircle(e)   { this._circles.add(e); }
  unregisterCircle(e) { this._circles.delete(e); }
  registerAABB(e)     { this._aabbs.add(e); }
  unregisterAABB(e)   { this._aabbs.delete(e); }
  registerGoal(g)     { this._goals.push(g); }

  step() {
    const phys = tuning.physics;
    void phys;

    // Circle vs AABB
    for (const c of this._circles) {
      for (const a of this._aabbs) {
        if (!(c.layersMask & a.layer)) continue;
        this._resolveCircleAABB(c, a);
      }
    }

    // Circle vs Circle (n^2 over small set)
    const list = [...this._circles];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (!(a.layersMask & b.layer)) continue;
        if (!(b.layersMask & a.layer)) continue;
        this._resolveCircleCircle(a, b);
      }
    }

    // Goal-line check
    const now = performance.now();
    if (now >= this._goalLockedUntil) {
      for (const ball of this._circles) {
        if (ball.layer !== LAYER.BALL) continue;
        for (const goal of this._goals) {
          const inX = goal.side === 'right' ? (ball.x + ball.radius >= goal.x)
                                            : (ball.x - ball.radius <= goal.x);
          const inY = (ball.y >= goal.yTop && ball.y <= goal.yBottom);
          if (inX && inY) {
            this._goalLockedUntil = now + tuning.collision.goalLockMs;
            const scorer = ball.lastToucher ?? goal.scoringPlayerId; // own-goal default
            this._bus.emit('goal-scored', { playerId: scorer, ballEntity: ball });
            return; // single goal per step
          }
        }
      }
    }
  }

  _resolveCircleAABB(c, a) {
    const closestX = Math.max(a.x, Math.min(c.x, a.x + a.width));
    const closestY = Math.max(a.y, Math.min(c.y, a.y + a.height));
    const dx = c.x - closestX;
    const dy = c.y - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= c.radius * c.radius) return;
    const dist = Math.sqrt(distSq) || 0.0001;
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = c.radius - dist;

    // Pick restitution
    let e = 0.5;
    if (c.layer === LAYER.BALL) {
      if (a.layer === LAYER.FLOOR) e = tuning.collision.restitutionBallFloor;
      else if (a.layer === LAYER.WALL) e = tuning.collision.restitutionBallWall;
      else if (a.layer === LAYER.POST) e = tuning.collision.restitutionBallPost;
    }

    // Reflect velocity (AABB is static)
    const vDotN = c.vx * nx + c.vy * ny;
    if (vDotN < 0) {
      c.vx -= (1 + e) * vDotN * nx;
      c.vy -= (1 + e) * vDotN * ny;
    }

    // Position correction
    const correction = Math.max(overlap - tuning.collision.penetrationSlop, 0)
                     * tuning.collision.correctionPercent;
    c.x += correction * nx;
    c.y += correction * ny;

    // Events
    if (c.layer === LAYER.BALL) {
      const speed = Math.hypot(c.vx, c.vy);
      if (a.layer === LAYER.FLOOR) this._bus.emit('ball-hit-floor', { speed });
      if (a.layer === LAYER.WALL)  this._bus.emit('ball-hit-wall',  { speed });
      if (a.layer === LAYER.POST)  this._bus.emit('ball-hit-post',  { speed });
    }
  }

  _resolveCircleCircle(A, B) {
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const sumR = A.radius + B.radius;
    const distSq = dx * dx + dy * dy;
    if (distSq >= sumR * sumR) return;
    const dist = Math.sqrt(distSq) || 0.0001;
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = sumR - dist;

    const vRel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
    if (vRel >= 0) return; // separating

    const e = Math.min(A.restitution ?? tuning.collision.restitutionHeadBall,
                       B.restitution ?? tuning.collision.restitutionHeadBall);
    const invA = 1 / A.mass;
    const invB = 1 / B.mass;

    let j = -(1 + e) * vRel / (invA + invB);

    // Modifier hook
    const manifold = { A, B, nx, ny, overlap, j };
    if (A.physics) {
      for (const m of A.physics.getModifiers?.() ?? []) {
        const out = m.onCollisionResolve?.(manifold);
        if (typeof out === 'number') j = out;
      }
    }

    A.vx -= j * invA * nx;
    A.vy -= j * invA * ny;
    B.vx += j * invB * nx;
    B.vy += j * invB * ny;

    // Position correction (proportional to inverse mass)
    const correction = Math.max(overlap - tuning.collision.penetrationSlop, 0)
                     * tuning.collision.correctionPercent;
    const totalInv = invA + invB;
    A.x -= (correction * invA / totalInv) * nx;
    A.y -= (correction * invA / totalInv) * ny;
    B.x += (correction * invB / totalInv) * nx;
    B.y += (correction * invB / totalInv) * ny;

    // Ball-Head event (and lastToucher update)
    const ball = (A.layer === LAYER.BALL) ? A : (B.layer === LAYER.BALL) ? B : null;
    const head = (A.layer === LAYER.HEAD) ? A : (B.layer === LAYER.HEAD) ? B : null;
    if (ball && head) {
      ball.lastToucher = head.playerId;
      this._bus.emit('ball-hit-head', { playerId: head.playerId, hitVelocity: Math.abs(vRel) });
    }
  }
}
