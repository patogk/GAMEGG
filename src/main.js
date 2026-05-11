// MEGA HEAD CUP — Tier 0 bootstrap.
// Strict order per architecture.md §3.

import { tuning } from './tuning.js';
import { EventBus } from './engine/event-bus.js';
import { GameLoop } from './engine/game-loop.js';
import { InputBus } from './engine/input-bus.js';
import { RenderContext } from './engine/render-context.js';
import { Physics } from './game/physics.js';
import { Collision, LAYER } from './game/collision.js';
import { MatchState, PHASE } from './game/match-state.js';
import { PlayerCharacter } from './game/player.js';
import { Ball } from './game/ball.js';
import { Renderer } from './render/renderer.js';
import { HUD } from './render/hud.js';

// 1. Foundation singletons
const bus      = new EventBus();
const loop     = new GameLoop();
const input    = new InputBus({ bus });
const canvas   = document.getElementById('game-canvas');
const ctxWrap  = new RenderContext({ canvas });
const renderer = new Renderer({ ctxWrap, bus });

// 2. Core systems
const physics    = new Physics();
const collision  = new Collision({ bus });
const matchState = new MatchState({ bus });

// 3. Static field geometry (AABBs)
const t = tuning;
collision.registerAABB({ x: 0, y: t.field.floorY, width: t.field.width, height: 200, layer: LAYER.FLOOR });
collision.registerAABB({ x: 0, y: -200, width: t.field.width, height: 200, layer: LAYER.WALL }); // ceiling
collision.registerAABB({ x: -t.field.wallThickness, y: 0, width: t.field.wallThickness, height: t.field.floorY, layer: LAYER.WALL }); // left wall
collision.registerAABB({ x: t.field.width, y: 0, width: t.field.wallThickness, height: t.field.floorY, layer: LAYER.WALL }); // right wall

// 4. Goals (one on each side, opening toward center)
const goalYTop = t.field.floorY - t.field.goalHeight;
const goalYBot = t.field.floorY;
// Posts (visual + collision)
collision.registerAABB({ x: 0, y: goalYTop - 8, width: t.field.goalWidth, height: 8, layer: LAYER.POST }); // P2 (left) crossbar
collision.registerAABB({ x: t.field.width - t.field.goalWidth, y: goalYTop - 8, width: t.field.goalWidth, height: 8, layer: LAYER.POST }); // P1 (right) crossbar

// Goal sensors — ball entering left goal scores for p1; ball entering right goal scores for p2
collision.registerGoal({ side: 'left',  x: t.field.goalWidth,                 yTop: goalYTop, yBottom: goalYBot, scoringPlayerId: 'p1' });
collision.registerGoal({ side: 'right', x: t.field.width - t.field.goalWidth, yTop: goalYTop, yBottom: goalYBot, scoringPlayerId: 'p2' });

// 5. Spawn entities
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

// 6. Register Drawables (per ADR-002)
renderer.register(p1);
renderer.register(p2);
renderer.register(ball);
renderer.register(new HUD({ matchState }));

// 7. Start the loop
loop.start(
  (dt) => {
    if (matchState.phase === PHASE.PLAYING || matchState.phase === PHASE.GOAL_PAUSE) {
      physics.step(dt);
      collision.step();
      p1.update(dt);
      p2.update(dt);
      ball.update(dt);
    }
    matchState.tick(dt);
    input.tick();
  },
  (alpha, t) => renderer.render(alpha, t)
);

// 8. Tier 0 inline hitstop (per ADR-004 — superseded by JuiceController in Tier 1)
bus.on('goal-scored', () => loop.pulseHitstop(tuning.loop.tier0HitstopMs));

// 9. R to restart match (Tier 0 quality of life)
bus.on('restart-pressed', () => {
  matchState.reset();
  ball.reset();
  p1.x = 320; p1.y = 500; p1.vx = 0; p1.vy = 0;
  p2.x = 960; p2.y = 500; p2.vx = 0; p2.vy = 0;
});

console.log('MEGA HEAD CUP — Tier 0 ready. P1: WASD, P2: Arrows. R = reset.');
