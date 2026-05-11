// Special system. One-button-one-effect per PR-SCOPE.
// Each player has a `specialType` string; this module dispatches the effect.
//
// Wired in main.js via:
//   bus.on('p1-special-pressed', () => tryFireSpecial(p1, ball, bus));
//   bus.on('p2-special-pressed', () => tryFireSpecial(p2, ball, bus));

import { tuning } from '../tuning.js';

export function tryFireSpecial(player, ball, bus) {
  const now = performance.now();
  if (now < (player.specialCooldownEndsAt ?? 0)) return false;

  const fired = applySpecial(player.specialType, player, ball, bus);
  if (fired) {
    player.specialCooldownEndsAt = now + tuning.player.specialCooldownMs;
    bus.emit(`${player.id}-special-fired`, { specialType: player.specialType });
  }
  return fired;
}

function applySpecial(type, player, ball, bus) {
  switch (type) {
    case 'fire-impulse': return fireImpulse(player, ball, bus);
    case 'mega-jump':    return megaJump(player, bus);
    case 'freeze-dash':  return freezeDash(player, bus);
    case 'magnet-pull':  return magnetPull(player, ball, bus);
    default: return false;
  }
}

// ───────── individual specials ─────────

function fireImpulse(player, ball, bus) {
  // Punch the ball horizontally in the direction the player faces, but only
  // if the ball is within range. Adds a vertical kick for a flying golazo arc.
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist > tuning.special.fireImpulseRange) return false;
  const dirX = (player.facing ?? Math.sign(dx)) || 1;
  ball.vx = dirX * tuning.special.fireImpulseVx;
  ball.vy = -tuning.special.fireImpulseVy;
  ball.lastToucher = player.id;
  bus.emit('ball-toucher-changed', { playerId: player.id });
  bus.emit('special-vfx', { kind: 'fire', x: player.x + dirX * 40, y: player.y, color: 'orange' });
  return true;
}

function megaJump(player, bus) {
  // Triples jump height. Only useful if you don't waste it.
  player.vy = -tuning.special.megaJumpVelocity;
  player._isGrounded = false;
  bus.emit('special-vfx', { kind: 'mega-jump', x: player.x, y: player.y + player.radius, color: 'lime' });
  return true;
}

function freezeDash(player, bus) {
  // Short horizontal burst in facing direction; brief invulnerability not modeled.
  const dir = player.facing ?? 1;
  player.vx = dir * tuning.special.freezeDashVx;
  // small upward nudge so you can dash slightly upward
  player.vy = Math.min(player.vy, -100);
  bus.emit('special-vfx', { kind: 'dash', x: player.x, y: player.y, color: 'magenta', dir });
  return true;
}

function magnetPull(player, ball, bus) {
  // Snap a strong impulse toward the player's mouth — only if within range.
  const dx = player.x - ball.x;
  const dy = (player.y - 6) - ball.y;
  const dist = Math.hypot(dx, dy) || 1;
  if (dist > tuning.special.magnetPullRange) return false;
  const k = tuning.special.magnetPullImpulse / dist;
  ball.vx += dx * k * 0.02;
  ball.vy += dy * k * 0.02;
  bus.emit('special-vfx', { kind: 'magnet', x: ball.x, y: ball.y, color: 'yellow' });
  return true;
}
