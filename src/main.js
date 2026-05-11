// MEGA HEAD CUP — bootstrap (Sprint 02 build).
// Flow: MENU → CHAR_SELECT → COUNTDOWN → PLAYING ↔ GOAL_PAUSE → RESULT → MENU

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
import { ModifierSystem } from './game/modifiers.js';
import { tryFireSpecial } from './game/special.js';
import { getCharacterById } from './game/characters.js';
import { Renderer } from './render/renderer.js';
import { HUD } from './render/hud.js';
import { ParticleSystem } from './render/particles.js';
import { MainMenu } from './ui/main-menu.js';
import { CharacterSelect } from './ui/char-select.js';
import { ResultScreen } from './ui/result-screen.js';
import { DebugOverlay } from './tools/debug-overlay.js';

// ───── 1. Foundation ─────
const bus      = new EventBus();
const loop     = new GameLoop();
const input    = new InputBus({ bus });
const canvas   = document.getElementById('game-canvas');
const ctxWrap  = new RenderContext({ canvas });
const renderer = new Renderer({ ctxWrap, bus });
const audio    = new AudioCtx();

// ───── 2. Core ─────
const physics    = new Physics();
const collision  = new Collision({ bus });
const matchState = new MatchState({ bus });

// ───── 3. Static geometry ─────
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

// ───── 4. Entities ─────
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

// ───── 5. Presentation + Sprint 02 systems ─────
const particles   = new ParticleSystem({ bus });
const juice       = new JuiceController({ bus, loop, ctxWrap });
const audioPlayer = new AudioPlayer({ audioCtx: audio, bus });
const debug       = new DebugOverlay();
const modSys      = new ModifierSystem({ physics, collision, ball, bus });
void juice; void audioPlayer; void debug;

bus.on('ball-hit-head', () => particles.noteBallPosition(ball.x, ball.y));

// ───── 6. Screens (Drawables) ─────
const menu       = new MainMenu({ matchState, bus });
const charSelect = new CharacterSelect({ matchState, bus, audioPlayer });
const resultScr  = new ResultScreen({ matchState, bus });
const hud        = new HUD({ matchState, p1, p2 });

renderer.register(p1);
renderer.register(p2);
renderer.register(ball);
renderer.register(particles);
renderer.register(hud);
renderer.register(menu);
renderer.register(charSelect);
renderer.register(resultScr);

// ───── 7. Game loop ─────
loop.start(
  (dt) => {
    const phase = matchState.phase;
    if (phase === PHASE.PLAYING || phase === PHASE.GOAL_PAUSE || phase === PHASE.COUNTDOWN) {
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

// ───── 8. Phase transitions ─────

// MENU → CHAR_SELECT on any input
function leaveMenu() {
  if (matchState.phase !== PHASE.MENU) return;
  matchState.goto(PHASE.CHAR_SELECT);
  charSelect.enter();
}
['p1-jump-pressed','p2-jump-pressed','p1-special-pressed','p2-special-pressed','restart-pressed']
  .forEach((ev) => bus.on(ev, leaveMenu));

// CHAR_SELECT → COUNTDOWN when both finalize
bus.on('selections-finalized', ({ p1: c1, p2: c2, modifier }) => {
  // Apply character presets (mouth shape from catalog)
  const ch1 = getCharacterById(c1);
  const ch2 = getCharacterById(c2);
  p1.mouthShape = ch1.mouthShape;
  p2.mouthShape = ch2.mouthShape;
  p1.specialType = ch1.specialType;
  p2.specialType = ch2.specialType;

  // Apply modifier (clear any previous)
  modSys.setActive(modifier);

  // Reset positions and start countdown
  p1.x = 320; p1.y = 500; p1.vx = 0; p1.vy = 0;
  p2.x = 960; p2.y = 500; p2.vx = 0; p2.vy = 0;
  ball.reset();
  matchState.goto(PHASE.COUNTDOWN);
});

// RESULT: revancha → back to CHAR_SELECT (keeping previous selection visible)
bus.on('rematch-requested', () => {
  if (matchState.phase !== PHASE.RESULT) return;
  modSys.clear();
  matchState.goto(PHASE.CHAR_SELECT);
  charSelect.enter();
});

// RESULT: back to menu
bus.on('back-to-menu-requested', () => {
  modSys.clear();
  matchState.goto(PHASE.MENU);
});

// ───── 9. Specials ─────
bus.on('p1-special-pressed', () => {
  if (matchState.phase === PHASE.PLAYING) tryFireSpecial(p1, ball, bus);
});
bus.on('p2-special-pressed', () => {
  if (matchState.phase === PHASE.PLAYING) tryFireSpecial(p2, ball, bus);
});

// Special VFX → spawn particles
bus.on('special-vfx', ({ x, y, color }) => {
  particles.noteBallPosition(x, y);
  // emit a synthetic hit-head event ONLY to particle system (light)
  // simpler: directly call internal spawn? keep simple: tag via noteBallPosition + emit a fake hit
  particles._spawnBurst(x, y, color, 10, 400);
});

// Special-fired SFX
bus.on('p1-special-fired', () => audioPlayer.play('post'));
bus.on('p2-special-fired', () => audioPlayer.play('post', { detune: 60 }));

console.log('MEGA HEAD CUP — Sprint 02 build ready. P1: WASD+G · P2: Arrows+, · R restart · Esc menu · ` debug.');
