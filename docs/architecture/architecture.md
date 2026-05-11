# Architecture — MEGA HEAD CUP

*Created: 2026-05-11*
*Status: Draft — pending TD-ARCHITECTURE gate*
*Stack: Vanilla JS (ES2022) + HTML5 Canvas 2D + Web Audio API. No build, no framework, no engine.*

> **Source documents** (binding):
> - `design/gdd/game-concept.md` (locked)
> - `design/art/art-bible.md` (APPROVED)
> - `design/gdd/systems-index.md` (TD-SYSTEM-BOUNDARY: CONCERNS, accepted)
> - `design/gdd/{game-loop,input-bus,physics,collision,player-character,ball,renderer}.md`
> - `.claude/docs/technical-preferences.md` (configured for vanilla JS web)

---

## 1. Architectural Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER (web)                            │
│                                                                  │
│  index.html  ──►  src/main.js  (ES module entry)                 │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Foundation layer (no game logic, no opinions)             │  │
│  │  Tuning · EventBus · GameLoop · InputBus · RenderContext   │  │
│  └─────┬──────────────────────────────────────────────────────┘  │
│        │                                                         │
│        ▼                                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Core layer (game-agnostic engine)                         │  │
│  │  Physics · Collision · MatchState · ScoreSystem · Timer    │  │
│  └─────┬──────────────────────────────────────────────────────┘  │
│        │                                                         │
│        ▼                                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Feature layer (game logic)                                │  │
│  │  PlayerCharacter · Ball · Special(T1) · Modifiers(T1)      │  │
│  └─────┬──────────────────────────────────────────────────────┘  │
│        │                                                         │
│        ▼                                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Presentation layer (rendering & feedback)                 │  │
│  │  Renderer · HUD · Particles(T1) · Juice(T1) · Audio(T1)    │  │
│  └─────┬──────────────────────────────────────────────────────┘  │
│        │                                                         │
│        ▼                                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Polish (orthogonal — meta systems)                        │  │
│  │  Storage · KbCalibration(T1) · DebugOverlay(T1) · Menus    │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Communication backbone:** EventBus (pub/sub) handles cross-system messaging without direct imports between Feature and Presentation. Direct imports allowed only **down** the layer stack (a Core system may import a Foundation system, but never the reverse).

---

## 2. File / Directory Layout

```
GAMEGG/
├── index.html                  # entry HTML; loads src/main.js as module
├── src/
│   ├── main.js                 # bootstrap: wire foundation → core → feature → presentation
│   ├── tuning.js               # all magic numbers (single source of truth)
│   │
│   ├── engine/                 # Foundation layer
│   │   ├── event-bus.js
│   │   ├── game-loop.js
│   │   ├── input-bus.js
│   │   ├── render-context.js
│   │   └── audio-context.js    # Tier 1
│   │
│   ├── game/                   # Core + Feature layers
│   │   ├── physics.js          # Core — integrator + Modifier plugin API (ADR-003)
│   │   ├── collision.js        # Core — circle/AABB + goal-line detection
│   │   ├── match-state.js      # Core — FSM
│   │   ├── score-system.js     # Core
│   │   ├── timer.js            # Core
│   │   ├── player.js           # Feature — PlayerCharacter
│   │   ├── ball.js             # Feature
│   │   ├── special.js          # Feature — Tier 1
│   │   ├── modifiers.js        # Feature — Tier 1 (uses Physics plugin API)
│   │   ├── ai.js               # Feature — Vertical Slice
│   │   └── juice.js            # Presentation logic but in /game (touches GameLoop) — Tier 1
│   │
│   ├── render/                 # Presentation layer
│   │   ├── renderer.js         # Drawable contract (ADR-002)
│   │   ├── hud.js              # implements Drawable
│   │   ├── particles.js        # Tier 1
│   │   ├── glow-cache.js       # pre-rendered radial gradients
│   │   └── overlays.js         # goal flash, slow-mo aberration
│   │
│   ├── ui/                     # Polish (UI screens)
│   │   ├── main-menu.js        # Tier 1
│   │   ├── char-select.js      # Tier 1
│   │   ├── result-screen.js    # Tier 1
│   │   └── calibration.js      # Tier 1
│   │
│   └── tools/                  # Polish (dev tools)
│       ├── debug-overlay.js    # dat.gui — Tier 1 week 1
│       └── storage.js          # localStorage wrapper
│
├── assets/                     # post-Tier-0
│   └── sfx/*.ogg
│
├── docs/
│   └── architecture/
│       ├── architecture.md     # this file
│       ├── adr-001-modular-from-line-1.md
│       ├── adr-002-drawable-contract.md
│       ├── adr-003-physics-modifier-plugin-api.md
│       └── adr-004-tier0-inline-hitstop.md
│
├── design/                     # GDDs, art bible, systems index
└── .claude/                    # CCGS framework
```

**Naming:** kebab-case files, PascalCase classes, camelCase for everything else. See `.claude/docs/technical-preferences.md` § Naming Conventions for the full rules.

---

## 3. Bootstrap (`src/main.js`)

Strict order (verified via TD-SYSTEM-BOUNDARY):

```js
import { tuning } from './tuning.js';
import { EventBus } from './engine/event-bus.js';
import { GameLoop } from './engine/game-loop.js';
import { InputBus } from './engine/input-bus.js';
import { RenderContext } from './engine/render-context.js';
import { Physics } from './game/physics.js';
import { Collision } from './game/collision.js';
import { MatchState } from './game/match-state.js';
import { ScoreSystem } from './game/score-system.js';
import { Timer } from './game/timer.js';
import { PlayerCharacter } from './game/player.js';
import { Ball } from './game/ball.js';
import { Renderer } from './render/renderer.js';
import { HUD } from './render/hud.js';

// 1. Foundation singletons (instantiate once, no game logic yet)
const bus       = new EventBus();
const loop      = new GameLoop({ tuning });
const input     = new InputBus({ bus, tuning });
const canvas    = document.getElementById('game-canvas');
const ctxWrap   = new RenderContext({ canvas, tuning });
const renderer  = new Renderer({ ctxWrap, tuning });

// 2. Core systems
const physics   = new Physics({ tuning, loop });
const collision = new Collision({ physics, bus, tuning });
const matchState = new MatchState({ bus, tuning });
const score     = new ScoreSystem({ bus, matchState });
const timer     = new Timer({ loop, bus, matchState, tuning });

// 3. Feature: spawn entities
const p1 = new PlayerCharacter({ id: 'p1', spawnX: 320, spawnY: 500, color: tuning.colors.p1Cyan, physics, collision, input, bus, tuning });
const p2 = new PlayerCharacter({ id: 'p2', spawnX: 960, spawnY: 500, color: tuning.colors.p2Magenta, physics, collision, input, bus, tuning });
const ball = new Ball({ x: 640, y: 360, physics, collision, bus, tuning });

// 4. Presentation: register Drawables (ADR-002)
renderer.register(p1);
renderer.register(p2);
renderer.register(ball);
renderer.register(new HUD({ matchState, score, timer, tuning }));

// 5. Wire and start
loop.start(
  (dt) => {
    physics.step(dt);
    collision.step();
    p1.update(dt); p2.update(dt);
    ball.update(dt);
    matchState.tick(dt);
    input.tick();
  },
  (alpha, t) => renderer.render(alpha, t)
);

// 6. Tier 0: hitstop inline (per ADR-004)
bus.on('goal-scored', () => loop.pulseHitstop(tuning.loop.tier0HitstopMs));
```

This is the **complete bootstrap** for Tier 0. Tier 1 adds AudioContext, JuiceController, ParticleSystem, DebugOverlay, MainMenu/CharacterSelect/ResultScreen, KeyboardCalibration, PersistentStorage init.

---

## 4. Cross-Cutting Concerns

### 4.1 Time

- Single source: GameLoop owns `timeScale` and produces `dt` for sub-steps.
- All systems take `dt` as parameter; **never** call `performance.now()` for game timing. (Allowed for profiling/log timestamps only.)
- Slow-mo = `setTimeScale(0.15, 600ms)`; hitstop = `pulseHitstop(150ms)`. JuiceController owns the policy in Tier 1; main.js wires it inline in Tier 0 (ADR-004).

### 4.2 State

- **Tuning** (`src/tuning.js`): mutable config. Read-only at use site (`tuning.X`, never destructured at module scope — see ADR-001 + `.claude/docs/technical-preferences.md` Forbidden Patterns).
- **MatchState**: owns all match-scoped state (players, scores, time remaining, modifier). FSM transitions via methods + emitted events.
- **Per-system state**: encapsulated in the class; no globals.
- **Persistence**: localStorage via `tools/storage.js` (Tier 1).

### 4.3 Communication

- **Direct method calls** allowed only **down** the layer stack (Foundation → Core → Feature → Presentation). E.g., PlayerCharacter calls `physics.registerEntity(this.entity)` — Feature → Core, allowed.
- **EventBus** required for any **upward or sideways** communication. E.g., Collision emits `'goal-scored'`; ScoreSystem (Core) and JuiceController (Presentation) both subscribe — sideways/upward, must be event-based.
- Event names: kebab-case verb-past (`'goal-scored'`, `'ball-hit-head'`, `'special-fired'`, `'score-changed'`, `'match-end'`). Document the full catalog in EventBus GDD (post-Tier-1).

### 4.4 Error handling

- **Foundation**: defensive — never crash the loop. `try/catch` around drawable.draw, modifier hooks, event handlers; log to console.
- **Core/Feature**: assertions on inputs (e.g., `Physics.step(dt)` rejects dt ≤ 0). Failures are bugs, not runtime conditions.
- **No try/catch in normal flow** — only at boundaries (loop tick, drawable draw, event dispatch).

### 4.5 Performance

- **60fps locked** = 16.67ms total frame budget (per pillar P4).
  - Physics: ≤4ms (multiple sub-steps × small entity count).
  - Collision: ≤1.5ms.
  - Update (player + ball + match-state + input): ≤1ms.
  - Render: ≤8ms (Canvas 2D ops + glow blits + composite passes).
  - Slack: ≥2ms.
- Glow exclusively via additive composite + cached radial gradient sprites. **Forbidden**: `shadowBlur` per-frame (see tech-prefs).
- Cap: max ~50 active particles, ~10 active physics entities (2 players + 1 ball + ≤7 special-spawned, slack).
- Memory ≤50MB total. Asset payload ≤2MB MVP, ≤8MB full.

### 4.6 Browser compatibility

- Target: Chrome / Firefox / Safari last 2 versions.
- ES2022 features: classes, native modules, top-level await, `??`, optional chaining. All supported.
- Canvas 2D `globalCompositeOperation = 'lighter'`: universal support.
- Web Audio `AudioContext`: universal; lazy-init on first user gesture (autoplay policy).
- localStorage: universal; quota ~5MB per origin (we use <100KB).

---

## 5. Data Flow Diagrams

### 5.1 Single match tick (1 frame at 60fps; up to 2 sub-steps)

```
RAF tick (16.67ms)
  │
  ├─► GameLoop.frame()
  │     │
  │     ├─► hitstop check; if active, skip update sub-steps
  │     │
  │     ├─► For each sub-step (1/120s):
  │     │     1. Physics.step(dt)              ─── integrate
  │     │     2. Collision.step()              ─── detect + resolve + emit events
  │     │            │
  │     │            ├─► EventBus.emit('ball-hit-head', {...})
  │     │            │     ├─► Ball.onHit (lastToucher = playerId)
  │     │            │     ├─► AudioPlayer.play('hit') [Tier 1]
  │     │            │     └─► Particles.spawn('hit-spark') [Tier 1]
  │     │            │
  │     │            └─► EventBus.emit('goal-scored', {...})  [if applicable]
  │     │                  ├─► ScoreSystem.update
  │     │                  ├─► MatchState.transition(GOAL_PAUSE)
  │     │                  ├─► loop.pulseHitstop(150) [Tier 0; JuiceController in T1]
  │     │                  └─► (after 1.5s) Ball.reset()
  │     │     3. PlayerCharacter.update(dt) × 2   ─── input → intent → vx/vy mutation
  │     │     4. Ball.update(dt)                  ─── spinFake update
  │     │     5. MatchState.tick(dt)              ─── decrement timer if PLAYING
  │     │
  │     ├─► InputBus.tick()                ─── clear justPressed/justReleased
  │     │
  │     └─► Renderer.render(alpha, t)
  │           ├─► clear (bg black)
  │           ├─► For each Drawable in zOrder:
  │           │     drawable.draw(ctx, t, alpha)
  │           ├─► (slow-mo) chromatic aberration pass
  │           └─► (goal active) green flash overlay
  │
  └─► next RAF
```

### 5.2 Modifier hook flow (Tier 1+)

```
Physics.step(dt)
  │
  └─► For each entity:
        1. modifiers[].onPreIntegrate(entity, dt)   ─── may mutate gravityScale, vx/vy
        2. apply gravity + air friction
        3. integrate position
        4. modifiers[].onPostIntegrate(entity, dt)  ─── may teleport, wrap

Collision.step()
  │
  └─► For each contact pair (manifold):
        1. compute base impulse
        2. modifiers[].onCollisionResolve(manifold) ─── may scale impulse
        3. apply impulse + positional correction
        4. EventBus.emit('ball-hit-*', ...)
```

Modifier API is **frozen** (ADR-003): only those 3 hooks. Anything beyond requires a real new system (not a modifier).

---

## 6. API Boundary Contracts

| Producer | Contract | Consumer |
|---|---|---|
| GameLoop | `start(updateFn, renderFn)`, `setTimeScale(target, durMs)`, `pulseHitstop(ms)`, `getTimeScale()` | main.js, JuiceController (T1), Tier 0 inline subscriber |
| InputBus | EventBus events `'pX-action-{pressed,released}'` + `isPressed(action)`, `wasJustPressed(action)` | PlayerCharacter, MainMenu, CharacterSelect |
| Physics | `registerEntity(e)`, `step(dt)`, `registerModifier(m)` | PlayerCharacter, Ball, ModifierSystem |
| Collision | `registerCircle(e)`, `registerAABB(e)`, `registerGoal(g)`, `step()` + EventBus emit | PlayerCharacter, Ball, MatchState, JuiceController |
| EventBus | `on(event, handler) → unsub`, `off(event, handler)`, `emit(event, payload)` | every system |
| Renderer | `register(drawable)`, `unregister(drawable)`, `render(alpha, t)` + Drawable contract | every visible system |
| Drawable contract | `{ zOrder: number, visible: boolean, draw(ctx, t, alpha) }` (ADR-002) | implemented by PlayerCharacter, Ball, HUD, Particles, overlays |

**Frozen contracts (changing breaks dependents):**
- Physics modifier hooks signature (ADR-003)
- Drawable contract (ADR-002)
- Event payload shapes for `'goal-scored'`, `'ball-hit-head'`, `'score-changed'`, `'match-end'`

---

## 7. Required ADRs

| # | Title | Status | Why required |
|---|---|---|---|
| **001** | Modular ES modules from line 1 (no single-file phase) | Accepted | TD-SYSTEM-BOUNDARY mandate; affects every file |
| **002** | Renderer Drawable contract | Accepted | Resolves Renderer God Object risk; affects every visible system |
| **003** | Physics Modifier plugin API (frozen) | Accepted | Defines extension surface for ModifierSystem; locks API for Tier 1+ |
| **004** | Tier 0 inline hitstop in main.js (deferred JuiceController) | Accepted | Cuts JuiceController from Tier 0 critical path per TD scope cut |

Future ADRs (deferred until needed):
- ADR-005: Audio architecture (Web Audio API patterns) — author when AudioContext lands (Tier 1 week 1)
- ADR-006: 6KRO keyboard layout & calibration test — author with KeyboardCalibration GDD (Tier 1)
- ADR-007: Modifier authoring spec (catalog format, hook usage examples) — author with first 3 modifiers (Tier 1)
- ADR-008: localStorage schema & versioning — author with PersistentStorage (Tier 1)

---

## 8. Tier 0 vs Tier 1 architectural deltas

What changes between Tier 0 (today's prototype) and Tier 1 (full MVP):

| Concern | Tier 0 | Tier 1 |
|---|---|---|
| Hitstop on goal | Inline in main.js (ADR-004) | JuiceController owns + adds slow-mo + screen shake |
| Audio | None | AudioContext + AudioPlayer |
| Particles | None | ParticleSystem registered as Drawable |
| Special moves | None | Special class per character; per-char button maps to `'pX-special-pressed'` |
| Modifiers | None | ModifierSystem; uses Physics plugin API |
| Menus | None — direct to PLAYING | MainMenu → CharacterSelect → COUNTDOWN → PLAYING → RESULT |
| Keyboard layout | Simple WASD + Arrows + Space | 6KRO-safe + KeyboardCalibration screen at boot |
| Tuning UI | Hardcoded; reload page | dat.gui DebugOverlay via backtick toggle |
| Persistence | None | localStorage via tools/storage.js |

Tier 0 architecture is a **strict subset** of Tier 1 — no rework, only addition. This is the validation that the modular structure (ADR-001) is correct.

---

## 9. Risks & Open Issues

- **Tunneling at high ball velocities** — tracked in Collision GDD edge cases. Mitigated by `tuning.physics.maxVelocity = 3000` cap + 1/120s sub-steps. Re-evaluate post-Tier-0 if balls escape.
- **Glow fillrate at 1080p+ DPR=2** — never measured. Profile in Tier 0 with worst-case (2 players + ball + 50 hit particles glowing). Mitigation: reduce glow sprite cache resolution, not the scene complexity.
- **Web Audio latency on Safari** — known higher than Chrome (~50ms vs ~20ms). Audio cues for hits will feel "later". Acceptable for MVP; document if playtest complains.
- **localStorage quota corruption** — handle quota-exceeded errors as silent fallback (no persistence that session). Document in PersistentStorage GDD when authored.
- **Modifier interaction explosion (post-VS)** — only 1 modifier active in MVP/Tier 1 dodges the problem. Define `modifierStackingPolicy = 'singleton'` in tuning until vertical-slice forces a decision.

---

## 10. Director sign-off

> **TD-ARCHITECTURE:** Pending — to be filled by gate spawn after this document is reviewed.
