// MEGA HEAD CUP — bootstrap. Architecture.md §3 + Sprint 01 (Tier 1 wave 1).

import { tuning } from './tuning.js';
import { EventBus } from './engine/event-bus.js';
import { GameLoop } from './engine/game-loop.js';
import { InputBus } from './engine/input-bus.js';
import { RenderContext } from './engine/render-context.js';
import { AudioCtx } from './engine/audio-context.js';
import { AudioPlayer } from './engine/audio-player.js';
import { Physics } from './game/physics.js';
import { Collision, LAYER } from './game/collision.js';
import { MatchState, PHASE } from './game/match-state.js';
import { PlayerCharacter } from './game/player.js';
import { Ball } from './game/ball.js';
import { JuiceController } from './game/juice.js';
import { Renderer } from './render/renderer.js';
import { HUD } from './render/hud.js';
import { ParticleSystem } from './render/particles.js';
import { DebugOverlay } from './tools/debug-overlay.js';

// 1. Foundation
const bus      = new EventBus();
const loop     = new GameLoop();
const input    = new InputBus({ bus });
const canvas   = document.getElementById('game-canvas');
const ctxWrap  = new RenderContext({ canvas });
const renderer = new Renderer({ ctxWrap, bus });
const audio    = new AudioCtx();

// 2. Core
const physics    = new Physics();
const collision  = new Collision({ bus });
const matchState = new MatchState({ bus });

// 3. Static geometry
const t = tuning;
collision.registerAABB({ x: 0, y: t.field.floorY, width: t.field.width, height: 200, layer: LAYER.FLOOR });
collision.registerAABB({ x: 0, y: -200, width: t.field.width, height: 200, layer: LAYER.WALL });
collision.registerAABB({ x: -t.field.wallThickness, y: 0, width: t.field.wallThickness, height: t.field.floorY, layer: LAYER.WALL });
collision.registerAABB({ x: t.field.width, y: 0, width: t.field.wallThickness, height: t.field.floorY, layer: LAYER.WALL });

const goalYTop = t.field.floorY - t.field.goalHeight;
const goalYBot = t.field.floorY;
collision.registerAABB({ x: 0, y: goalYTop - 8, width: t.field.goalWidth, height: 8, layer: LAYER.POST });
collision.registerAABB({ x: t.field.width - t.field.goalWidth, y: goalYTop - 8, width: t.field.goalWidth, height: 8, layer: LAYER.POST });
collision.registerGoal({ side: 'left',  x: t.field.goalWidth,                 yTop: goalYTop, yBottom: goalYBot, scoringPlayerId: 'p1' });
collision.registerGoal({ side: 'right', x: t.field.width - t.field.goalWidth, yTop: goalYTop, yBottom: goalYBot, scoringPlayerId: 'p2' });

// 4. Entities
const p1 = new PlayerCharacter({
  id: 'p1', spawnX: 320, spawnY: 500, color: tuning.colors.p1Cyan,
  physics, collision, input, bus, mouthShape: 'smile',
});
const p2 = new PlayerCharacter({
  id: 'p2', spawnX: 960, spawnY: 500, color: tuning.colors.p2Magenta,
  physics, collision, input, bus, mouthShape: 'line',
});
const ball = new Ball({
  x: tuning.field.centerX, y: tuning.field.centerY - tuning.ball.spawnHeightOffset,
  physics, collision, bus,
});

// 5. Presentation — Tier 1
const particles  = new ParticleSystem({ bus });
const juice      = new JuiceController({ bus, loop, ctxWrap });
const audioPlayer = new AudioPlayer({ audioCtx: audio, bus });
const debug      = new DebugOverlay();
void juice; void audioPlayer; void debug; // wire-only

// Particles need the ball's position at the moment of impact (events don't carry it).
bus.on('ball-hit-head', () => particles.noteBallPosition(ball.x, ball.y));

// 6. Drawables (zOrder: field < entities < particles < HUD)
renderer.register(p1);
renderer.register(p2);
renderer.register(ball);
renderer.register(particles);
renderer.register(new HUD({ matchState }));

// 7. Start loop
loop.start(
  (dt) => {
    if (matchState.phase === PHASE.PLAYING || matchState.phase === PHASE.GOAL_PAUSE) {
      physics.step(dt);
      collision.step();
      p1.update(dt);
      p2.update(dt);
      ball.update(dt);
      particles.update(dt);
    }
    matchState.tick(dt);
    input.tick();
  },
  (alpha, t) => renderer.render(alpha, t)
);

// 8. Match restart
bus.on('restart-pressed', () => {
  matchState.reset();
  ball.reset();
  p1.x = 320; p1.y = 500; p1.vx = 0; p1.vy = 0;
  p2.x = 960; p2.y = 500; p2.vx = 0; p2.vy = 0;
});

// 9. Optional: pause hint (Tier 1 wiring; full pause UI in Sprint 02)
bus.on('pause-pressed', () => console.log('[pause] not yet implemented'));

console.log('MEGA HEAD CUP — Sprint 01 build ready. P1: WASD · P2: Arrows · R = reset · ` = debug.');
