// PlayerCharacter — kinematic-controlled head. Per player-character.md GDD.

import { tuning } from '../tuning.js';
import { LAYER } from './collision.js';

export class PlayerCharacter {
  constructor({ id, spawnX, spawnY, color, physics, collision, input, bus, mouthShape = 'smile' }) {
    this.id = id;        // 'p1' | 'p2'
    this.color = color;
    this.mouthShape = mouthShape;
    this._spawnX = spawnX; this._spawnY = spawnY;
    this._physics = physics;
    this._collision = collision;
    this._input = input;
    this._bus = bus;

    // Drawable contract
    this.zOrder = 15;
    this.visible = true;

    // Physics entity (used by Physics + Collision)
    this.x = spawnX; this.y = spawnY;
    this.prevX = spawnX; this.prevY = spawnY;
    this.vx = 0; this.vy = 0;
    this.mass = tuning.player.mass;
    this.gravityScale = 1;
    this.radius = tuning.player.headRadius;
    this.layer = LAYER.HEAD;
    // HEAD ignores other HEADs; collides with WALL+FLOOR+POST+BALL
    this.layersMask = LAYER.WALL | LAYER.FLOOR | LAYER.POST | LAYER.BALL;
    this.restitution = 0.2;
    this.playerId = id;
    this.physics = physics; // Collision uses this to access modifiers

    this._isGrounded = false;
    this._wasGrounded = false;
    this._lastGroundedAt = -Infinity;
    this._jumpBufferedAt = -Infinity;
    this._intentLeft = false;
    this._intentRight = false;
    this._jumpHeld = false;
    this._facing = 1;

    physics.registerEntity(this);
    collision.registerCircle(this);

    // Subscribe inputs
    bus.on(`${id}-move-left-pressed`,   () => { this._intentLeft = true; this._facing = -1; });
    bus.on(`${id}-move-left-released`,  () => { this._intentLeft = false; });
    bus.on(`${id}-move-right-pressed`,  () => { this._intentRight = true; this._facing = 1; });
    bus.on(`${id}-move-right-released`, () => { this._intentRight = false; });
    bus.on(`${id}-jump-pressed`,        () => { this._jumpBufferedAt = performance.now(); this._jumpHeld = true; });
    bus.on(`${id}-jump-released`,       () => {
      this._jumpHeld = false;
      if (this.vy < 0) this.vy *= tuning.player.jumpCutFactor;
    });
  }

  update(dt) {
    if (dt > 0.05) dt = 0.05; // safety

    // Detect grounded: simple — if y >= floor - radius (touching) and moving down or zero
    const floorTouchY = tuning.field.floorY - this.radius;
    this._wasGrounded = this._isGrounded;
    this._isGrounded = (this.y >= floorTouchY - 0.5) && this.vy >= -0.001;
    if (this._isGrounded && !this._wasGrounded) {
      this._bus.emit(`${this.id}-landed`, { vy: this.vy });
    }
    if (this._isGrounded) this._lastGroundedAt = performance.now();

    // Horizontal intent
    const intentX = (this._intentRight ? 1 : 0) - (this._intentLeft ? 1 : 0);
    const desiredVx = intentX * tuning.player.maxRunSpeed;
    const deltaV = desiredVx - this.vx;
    const maxDeltaV = tuning.player.acceleration * dt;
    this.vx += Math.max(-maxDeltaV, Math.min(maxDeltaV, deltaV));

    if (intentX === 0 && this._isGrounded) {
      this.vx *= Math.pow(tuning.player.groundFriction, dt);
    }

    // Jump (with coyote + buffer)
    const now = performance.now();
    const bufferActive = (now - this._jumpBufferedAt) < tuning.player.jumpBufferMs;
    const coyoteActive = (now - this._lastGroundedAt) < tuning.player.coyoteMs;
    if (bufferActive && (this._isGrounded || coyoteActive)) {
      this.vy = -tuning.player.jumpVelocity;
      this._isGrounded = false;
      this._jumpBufferedAt = -Infinity;
      this._bus.emit(`${this.id}-jumped`);
    }

    // Out-of-bounds safety
    if (this.y > tuning.field.height + 500 || this.x < -500 || this.x > tuning.field.width + 500) {
      this.x = this._spawnX; this.y = this._spawnY; this.vx = 0; this.vy = 0;
    }
  }

  // Drawable.draw
  draw(ctx, t, alpha) {
    const rx = tuning.render.interpolationEnabled ? (this.prevX + (this.x - this.prevX) * alpha) : this.x;
    const ry = tuning.render.interpolationEnabled ? (this.prevY + (this.y - this.prevY) * alpha) : this.y;

    // Glow halo
    const glowName = this.id === 'p1' ? 'cyan' : 'magenta';
    this._renderCtx?.glow(ctx, rx, ry, glowName, this.radius);

    // Head circle
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(rx, ry, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    const eyeY = ry - this.radius * 0.15;
    const eyeOffsetX = this.radius * 0.35 * this._facing;
    const eyeR = this.radius * 0.12;
    ctx.beginPath(); ctx.arc(rx - eyeOffsetX * 0.4, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(rx + eyeOffsetX,        eyeY, eyeR, 0, Math.PI * 2); ctx.fill();

    // Mouth (simple line/arc)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const mouthY = ry + this.radius * 0.35;
    if (this.mouthShape === 'smile') {
      ctx.arc(rx, mouthY - 4, this.radius * 0.4, 0.2 * Math.PI, 0.8 * Math.PI);
    } else {
      ctx.moveTo(rx - this.radius * 0.3, mouthY);
      ctx.lineTo(rx + this.radius * 0.3, mouthY);
    }
    ctx.stroke();

    // Ground indicator ring
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(rx, tuning.field.floorY - 2, this.radius * 0.9, 4, 0, 0, Math.PI * 2);
    if (this.id === 'p1') ctx.stroke();
    else { ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]); }
  }

  // Renderer wires this in main.js so Player can call glow helper
  setRenderContext(rc) { this._renderCtx = rc; }
}
