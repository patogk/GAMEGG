// Ball entity — pure physics object, lastToucher tracks for glow + scoring.

import { tuning } from '../tuning.js';
import { LAYER } from './collision.js';

export class Ball {
  constructor({ x, y, physics, collision, bus }) {
    this._physics = physics;
    this._collision = collision;
    this._bus = bus;

    this.zOrder = 16;
    this.visible = true;

    this.x = x; this.y = y;
    this.prevX = x; this.prevY = y;
    this.vx = 0; this.vy = 0;
    this.mass = tuning.ball.mass;
    this.gravityScale = tuning.ball.gravityScale;
    this.radius = tuning.ball.radius;
    this.layer = LAYER.BALL;
    this.layersMask = LAYER.HEAD | LAYER.WALL | LAYER.FLOOR | LAYER.POST;
    this.restitution = tuning.collision.restitutionHeadBall;
    this.lastToucher = null;
    this.spinFake = 0;
    this.physics = physics;

    physics.registerEntity(this);
    collision.registerCircle(this);

    bus.on('ball-reset-requested', () => this.reset());
  }

  update(dt) {
    this.spinFake += this.vx * tuning.ball.spinScale * dt;
  }

  reset() {
    this.x = tuning.field.centerX;
    this.y = tuning.field.centerY - tuning.ball.spawnHeightOffset;
    this.prevX = this.x; this.prevY = this.y;
    this.vx = 0; this.vy = 0;
    this.lastToucher = null;
    this.spinFake = 0;
    this._bus.emit('ball-reset');
  }

  // Drawable.draw
  draw(ctx, t, alpha) {
    const rx = tuning.render.interpolationEnabled ? (this.prevX + (this.x - this.prevX) * alpha) : this.x;
    const ry = tuning.render.interpolationEnabled ? (this.prevY + (this.y - this.prevY) * alpha) : this.y;

    // Glow halo color = lastToucher
    const glowName = this.lastToucher === 'p1' ? 'cyan'
                   : this.lastToucher === 'p2' ? 'magenta'
                   : 'white';
    this._renderCtx?.glow(ctx, rx, ry, glowName, this.radius * 1.6);

    // Ball circle
    ctx.fillStyle = tuning.colors.ballWhite;
    ctx.beginPath();
    ctx.arc(rx, ry, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Spin indicator (rotating line)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(this.spinFake);
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.7, 0);
    ctx.lineTo( this.radius * 0.7, 0);
    ctx.stroke();
    ctx.restore();
  }

  setRenderContext(rc) { this._renderCtx = rc; }
}
