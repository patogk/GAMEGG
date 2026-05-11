# Systems Index — MEGA HEAD CUP

*Created: 2026-05-11*
*Status: Draft — pending TD-SYSTEM-BOUNDARY gate*

> Source: decomposed from `design/gdd/game-concept.md` (locked) and `design/art/art-bible.md` (APPROVED).
> Stack: Vanilla JS + Canvas 2D, ES2022 modules, no build.

---

## Summary table

| # | System | Layer | Priority | GDD | Owner specialist |
|---|---|---|---|---|---|
| 1 | **Tuning** | Foundation | MVP | — | tools-programmer |
| 2 | **EventBus** | Foundation | MVP | — | engine-programmer |
| 3 | **GameLoop** | Foundation | MVP | ⚠️ critical | engine-programmer |
| 4 | **InputBus** | Foundation | MVP | ⚠️ critical | engine-programmer |
| 5 | **RenderContext** | Foundation | MVP | — | engine-programmer |
| 6 | **AudioContext** | Foundation | Tier 1 (post Tier 0) | — | engine-programmer |
| 7 | **Physics** | Core | MVP | ⚠️ critical | gameplay-programmer |
| 8 | **Collision** | Core | MVP | ⚠️ critical | gameplay-programmer |
| 9 | **MatchState** | Core | MVP | — | gameplay-programmer |
| 10 | **ScoreSystem** | Core | MVP | — | gameplay-programmer |
| 11 | **Timer** | Core | MVP | — | gameplay-programmer |
| 12 | **PlayerCharacter** | Feature | MVP | ⚠️ critical | gameplay-programmer |
| 13 | **Ball** | Feature | MVP | ⚠️ critical | gameplay-programmer |
| 14 | **Special** | Feature | Tier 1 | ⚠️ critical | gameplay-programmer |
| 15 | **ModifierSystem** | Feature | Tier 1 | ⚠️ critical | gameplay-programmer |
| 16 | **AIController** | Feature | Vertical Slice | — | ai-programmer |
| 17 | **Renderer (Canvas2D)** | Presentation | MVP | ⚠️ critical | engine-programmer |
| 18 | **HUD** | Presentation | MVP | — | ui-programmer |
| 19 | **ParticleSystem** | Presentation | Tier 1 | — | engine-programmer |
| 20 | **JuiceController** | Presentation | Tier 1 | ⚠️ critical | gameplay-programmer |
| 21 | **AudioPlayer** | Presentation | Tier 1 | — | sound-designer + engine-programmer |
| 22 | **PersistentStorage** | Polish | Tier 1 | — | tools-programmer |
| 23 | **KeyboardCalibration** | Polish | Tier 1 | ⚠️ critical | ui-programmer |
| 24 | **DebugOverlay (dat.gui)** | Polish | MVP (week 1) | — | tools-programmer |
| 25 | **MainMenu** | Polish | Tier 1 | — | ui-programmer |
| 26 | **CharacterSelect** | Polish | Tier 1 | — | ui-programmer |
| 27 | **ResultScreen** | Polish | Tier 1 | — | ui-programmer |

**Legend:**
- ⚠️ critical = needs full GDD via `/design-system` before implementing
- — = simple enough; covered by inline comments in code + tuning.js entries
- "MVP" = Tier 0 (today, ~1 sitting)
- "Tier 1" = MVP completo (2-3 weeks)
- "Vertical Slice" = +6-10 weeks
- "Full Release" = +5-8 months

---

## Layered dependency map

### Foundation (zero dependencies — built first)

- **Tuning** (`src/tuning.js`)
  - Single source of truth for all magic numbers (physics constants, juice timings, colors, layout).
  - Loaded as ES module, mutable by DebugOverlay at runtime, persisted to localStorage on change.
  - Depends on: nothing.

- **EventBus** (`src/engine/event-bus.js`)
  - Pub/sub for cross-system events: `'goal-scored'`, `'ball-hit-head'`, `'special-fired'`, `'modifier-triggered'`, `'match-end'`, etc.
  - Depends on: nothing.

- **GameLoop** (`src/engine/game-loop.js`) ⚠️
  - `requestAnimationFrame` driver, fixed-timestep accumulator (1/120s sub-steps), variable render rate.
  - Owns the time-scale (`dt *= juice.slowmoFactor` during slow-mo).
  - Depends on: nothing (calls update + render callbacks injected from outside).

- **InputBus** (`src/engine/input-bus.js`) ⚠️
  - Wraps `keydown`/`keyup`, exposes per-frame state map, debounces, handles 6KRO-safe layout.
  - Emits semantic events via EventBus: `'p1-jump-pressed'`, `'p2-special-pressed'`, etc.
  - Depends on: EventBus.

- **RenderContext** (`src/engine/render-context.js`)
  - Wraps `<canvas>` 2D context, owns viewport, handles resize, exposes draw helpers (rect, circle, glow-blit).
  - Manages cached radial-gradient sprites for glow (per art-bible).
  - Depends on: Tuning.

- **AudioContext** (`src/engine/audio-context.js`) — Tier 1
  - Lazy-init Web Audio `AudioContext` on first user gesture.
  - Decode buffer cache, schedule via `audioCtx.currentTime`.
  - Depends on: EventBus (lazy-init triggered by first input event).

### Core (depends on Foundation)

- **Physics** (`src/game/physics.js`) ⚠️
  - Semi-implicit Euler integrator, gravity, air friction.
  - Operates on entities with `{x, y, vx, vy, mass, radius?}` shape.
  - Depends on: Tuning, GameLoop (called per fixed timestep).

- **Collision** (`src/game/collision.js`) ⚠️
  - Circle-circle (ball-head, ball-foot), AABB (entity-wall, entity-floor, entity-post), goal-line check.
  - Returns collision manifolds for resolution.
  - Depends on: Tuning, Physics (operates on same entity shape).

- **MatchState** (`src/game/match-state.js`)
  - Finite state machine: `BOOT → CALIBRATION → MENU → CHAR_SELECT → COUNTDOWN → PLAYING → GOAL_PAUSE → PLAYING|RESULT → MENU`.
  - Owns the active match data (players, scores, time remaining, modifier).
  - Depends on: EventBus, Tuning.

- **ScoreSystem** (`src/game/score-system.js`)
  - Listens to `'goal-scored'` events, updates score, emits `'score-changed'`.
  - Depends on: EventBus, MatchState.

- **Timer** (`src/game/timer.js`)
  - Counts down match duration (90s default from Tuning), emits `'time-tick'` and `'match-end'`.
  - Depends on: GameLoop, EventBus, MatchState.

### Feature (depends on Core)

- **PlayerCharacter** (`src/game/player.js`) ⚠️
  - Entity with position, velocity, jump state, special state (cooldown), facing direction.
  - Subscribes to `'p1-*-pressed'` / `'p2-*-pressed'` events.
  - Applies movement intent → physics integrator.
  - Depends on: Physics, Collision, InputBus, EventBus, Tuning.

- **Ball** (`src/game/ball.js`) ⚠️
  - Entity with position, velocity, last-toucher (for glow color per art-bible).
  - Pure physics object — no input.
  - Depends on: Physics, Collision, EventBus, Tuning.

- **Special** (`src/game/special.js`) ⚠️ — Tier 1
  - Per-character special move (cooldown, trigger condition, effect).
  - One-button-one-effect per PR-SCOPE constraint.
  - Catalog of specials (each character has one): `fire-impulse`, `mega-jump`, `freeze`, `multi-ball-illusion`, etc.
  - Depends on: PlayerCharacter, Ball, Physics, EventBus, Tuning.

- **ModifierSystem** (`src/game/modifiers.js`) ⚠️ — Tier 1
  - Modifiers as pure functions hooked to events: `onBallUpdate`, `onGravityResolve`, `onGoalScored`.
  - Cap: 1 modifier per match in MVP/Tier 1. Cap to 2 stackable post-vertical-slice.
  - Catalog: `low-gravity`, `giant-ball`, `tiny-goal`, `no-ball-gravity`, `bouncy-walls`, `lava-floor`.
  - Depends on: EventBus, Physics, Tuning.

- **AIController** (`src/game/ai.js`) — Vertical Slice
  - 3 niveles: easy (lenta y reactiva), medium (anticipa), hard (optimal con timings de special).
  - Sustituye a InputBus para uno de los 2 jugadores.
  - Depends on: PlayerCharacter, Ball, Physics (lectura), Tuning.

### Presentation (wraps gameplay; depends on Feature)

- **Renderer (Canvas2D)** (`src/render/renderer.js`) ⚠️
  - Reads game state (players, ball, particles, HUD), draws frame.
  - Implements art-bible techniques: silhouettes + additive glow + chromatic aberration during slow-mo + full-screen flash.
  - Depends on: RenderContext, Tuning, MatchState, PlayerCharacter, Ball, ParticleSystem, JuiceController.

- **HUD** (`src/render/hud.js`)
  - Score, timer, special-cooldown bars, modifier indicator.
  - Drawn into Canvas (no DOM overlay in MVP — keeps single render path).
  - Depends on: RenderContext, Tuning, MatchState, ScoreSystem, Timer.

- **ParticleSystem** (`src/render/particles.js`) — Tier 1
  - Simple particle pool, capped at 50 active simultaneously per perf budget.
  - Particle types: hit-spark, ball-trail, goal-explosion, special-aura, ambient (post-VS).
  - Depends on: RenderContext, EventBus, Tuning.

- **JuiceController** (`src/game/juice.js`) ⚠️ — Tier 1
  - Centraliza hitstop, slow-mo time-scale, screen shake.
  - Suscribe a `'goal-scored'` (≥400ms hitstop, slow-mo 600ms), `'special-fired'` (slow-mo 600ms), `'ball-hit-head-hard'` (shake escalado).
  - **Resuelve la regla P2↔P4**: hitstop solo en eventos raros importantes.
  - Depends on: EventBus, GameLoop (controla time-scale), Tuning.

- **AudioPlayer** (`src/engine/audio-player.js`) — Tier 1
  - Capa de alto nivel sobre AudioContext: `play(name, opts)`, gestión de polifonía, ducking de música en SFX importantes.
  - Suscribe a eventos relevantes (`'goal-scored'`, `'ball-hit-head'`, `'special-fired'`, etc.).
  - Depends on: AudioContext, EventBus, Tuning.

### Polish (meta-systems)

- **PersistentStorage** (`src/tools/storage.js`) — Tier 1
  - localStorage wrapper para settings, mejores scores, unlocks (post-VS), tuning overrides.
  - Depends on: nothing browser-side.

- **KeyboardCalibration** (`src/ui/calibration.js`) ⚠️ — Tier 1
  - Pantalla al boot que pide al usuario presionar todas las teclas de ambos jugadores simultáneamente y detecta drops de input (6KRO test).
  - Si detecta drops, warning + sugerencia de cambiar layout o teclado.
  - Depends on: InputBus (raw mode), RenderContext, EventBus.

- **DebugOverlay (dat.gui)** (`src/tools/debug-overlay.js`) — MVP (week 1)
  - dat.gui (CDN) con sliders para toda la sección Tuning. Toggle con tecla ` ` ` ` `.
  - Persiste cambios a localStorage via PersistentStorage.
  - Stripped en build de producción.
  - Depends on: Tuning, PersistentStorage.

- **MainMenu** (`src/ui/main-menu.js`) — Tier 1
  - Pantalla de inicio: Play / Settings / How to play.
  - Depends on: RenderContext, InputBus, MatchState (transition), AudioPlayer (ui-confirm).

- **CharacterSelect** (`src/ui/char-select.js`) — Tier 1
  - 2 personajes seleccionables uno por jugador en pantalla simultánea.
  - Roulette de modifier random visible aquí (animación de slot que se detiene).
  - Depends on: MainMenu (transition), RenderContext, InputBus, ModifierSystem (catálogo), PlayerCharacter (presets).

- **ResultScreen** (`src/ui/result-screen.js`) — Tier 1
  - Score final, replay slow-mo del último gol, botón revancha (1 click) / volver al menu.
  - Depends on: MatchState, ScoreSystem, JuiceController (replay = re-trigger slow-mo de los últimos 2s del gol final), InputBus.

---

## Dependency graph (textual)

```
Tuning ──► (everything)
EventBus ──► (everything that emits/subscribes)

GameLoop ──► (orchestrates update+render)
InputBus ──► EventBus
RenderContext ──► Tuning
AudioContext ──► EventBus

Physics ──► Tuning, GameLoop
Collision ──► Tuning, Physics
MatchState ──► EventBus, Tuning
ScoreSystem ──► EventBus, MatchState
Timer ──► GameLoop, EventBus, MatchState

PlayerCharacter ──► Physics, Collision, InputBus, EventBus, Tuning
Ball ──► Physics, Collision, EventBus, Tuning
Special ──► PlayerCharacter, Ball, Physics, EventBus, Tuning
ModifierSystem ──► EventBus, Physics, Tuning
AIController ──► PlayerCharacter, Ball, Physics, Tuning

Renderer ──► RenderContext, Tuning, MatchState, PlayerCharacter, Ball, ParticleSystem, JuiceController
HUD ──► RenderContext, Tuning, MatchState, ScoreSystem, Timer
ParticleSystem ──► RenderContext, EventBus, Tuning
JuiceController ──► EventBus, GameLoop, Tuning
AudioPlayer ──► AudioContext, EventBus, Tuning

PersistentStorage ──► (nothing browser-side)
KeyboardCalibration ──► InputBus, RenderContext, EventBus
DebugOverlay ──► Tuning, PersistentStorage
MainMenu ──► RenderContext, InputBus, MatchState, AudioPlayer
CharacterSelect ──► MainMenu, RenderContext, InputBus, ModifierSystem, PlayerCharacter
ResultScreen ──► MatchState, ScoreSystem, JuiceController, InputBus
```

### Bottleneck systems (many dependents) — design with extra care
- **Tuning** — todo depende. Mutación en runtime debe ser segura. Persistir a localStorage.
- **EventBus** — bus central. Cuidar fugas de listeners y evitar circular event chains.
- **GameLoop** — controla time-scale (slow-mo). Cualquier sistema que mide tiempo debe usar `dt` provisto, no `performance.now()` directo.
- **Physics + Collision** — si están mal, todo el feel se cae. Tier 0 los valida.

### No circular dependencies detectadas
Todas las dependencias forman DAG. Si en implementación aparece una circular (ej: Special necesita JuiceController y JuiceController suscribe a `'special-fired'`), la resolución es vía EventBus (Special emite el evento, JuiceController lo escucha — sin import directo).

---

## Tier 0 system slice (HOY — 1 sesión, 4-8h)

> **Cut por TD-SYSTEM-BOUNDARY:** se quitan de Tier 0 **JuiceController** y **DebugOverlay**.
> La hipótesis Tier 0 es "¿cabezazo + gol = divertido?" — ninguno está en el critical path. JuiceController y DebugOverlay entran en semana 1 de Tier 1 (DebugOverlay como constraint de TD-FEASIBILITY).
> **Hitstop de gol en Tier 0:** se hace inline (un `if` en GameLoop que pausa updates por 150ms tras `'goal-scored'`). Sin sistema dedicado.

Solo estos sistemas (14) para validar la hipótesis nuclear:

- ✅ Tuning (mínimo: gravity, restitution, runSpeed, jumpForce, headDiameter, ballRadius, fieldSize)
- ✅ EventBus
- ✅ GameLoop (sin time-scale aún, dt fijo; hitstop 150ms inline tras gol)
- ✅ InputBus (layout simple WASD + Arrows+Space; sin 6KRO calibration aún)
- ✅ RenderContext (sin glow cache aún; flat circles + rects)
- ✅ Physics
- ✅ Collision (solo circle-circle ball-head + AABB ball-floor/wall/post + goal-line)
- ✅ MatchState (mínimo: PLAYING / GOAL_PAUSE; sin BOOT/MENU)
- ✅ ScoreSystem
- ✅ Timer (60s para Tier 0)
- ✅ PlayerCharacter (sin special)
- ✅ Ball
- ✅ Renderer (solo flat shapes; sin particles, sin glow)
- ✅ HUD (solo score + timer)

**NO en Tier 0:** JuiceController, DebugOverlay, AudioContext, AudioPlayer, Special, ModifierSystem, ParticleSystem, KeyboardCalibration, MainMenu, CharacterSelect, ResultScreen, PersistentStorage, AIController.

---

## Open questions / TODOs

- **Multi-archivo o single-file?** Decisión arquitectónica para Tier 0: empezar single-file `index.html` con todo inline, refactorear a módulos en Tier 1 cuando ya valide el feel. Más velocidad de iteración hoy. ADR pendiente.
- **¿Renderer dibuja HUD también, o son separados?** Actualmente listados como sistemas separados pero ambos usan RenderContext. Probablemente un solo render pass que llama a HUD al final (post-game-world). Confirmar en GDD del Renderer.
- **¿JuiceController = parte de GameLoop o sistema separado?** Listado separado por separation of concerns, pero comparte tiempo con GameLoop. Posible fusión post-Tier-1.
- **¿KeyboardCalibration al boot siempre, o solo primera vez?** Probablemente solo primera vez + opción manual desde Settings.

---

## Director Sign-Off

> **TD-SYSTEM-BOUNDARY:** CONCERNS (accepted) — 2026-05-11

**Verdict:** CONCERNS — boundaries are fundamentally sound (clean DAG, reasonable layering, good use of EventBus to break would-be cycles). Approved to proceed to GDD authoring with the following items addressed in-GDD or in an ADR before implementation:

1. **JuiceController ↔ GameLoop time-scale ownership is muddy.** Doc says "GameLoop owns time-scale" AND "JuiceController controla time-scale". Pick one. Recommendation: GameLoop **owns** the `timeScale` variable and exposes a setter. JuiceController **commands** the setter in response to events. Document this contract in the GameLoop GDD (Tuning Knobs / API section). Otherwise two systems will race to mutate the same field.

2. **Renderer is the highest-risk God Object.** 7 dependencies, reads everyone's state. Mitigation in the Renderer GDD: define a `Drawable` contract (each entity exposes `getRenderData() → {pos, sprite, glowColor, ...}`). Renderer should depend on RenderContext + Tuning + a list of drawables, NOT on PlayerCharacter / Ball / ParticleSystem types directly. This also lets HUD share the render pass cleanly (resolves open question #2).

3. **ModifierSystem will leak physics knowledge — accept it explicitly.** Hooks like `onGravityResolve` mean modifiers ARE physics extensions, not pure event subscribers. Don't pretend otherwise. In the ModifierSystem GDD, declare modifiers as a documented Physics plugin layer with a frozen API surface (`{onPreIntegrate, onPostIntegrate, onCollisionResolve}`). Cleaner than pretending it's pure pub/sub.

4. **Tuning as universal dependency is fine, but freeze the access pattern.** Direct mutation by DebugOverlay is the right call. Hazard: every module importing the same `tuning` object means hot-reload of values requires no reference caching at module scope (e.g., `const G = tuning.gravity` at the top of physics.js will silently desync). Document the rule in Tuning GDD: **always read `tuning.X` at use site, never destructure into module-level consts**.

5. **Tier 0 slice is too ambitious for one 4-8h sitting.** 16 systems including JuiceController and DebugOverlay is ~2 sittings of work for a first-time solo dev even with vanilla JS. Recommended cut: drop **JuiceController** (defer hitstop to Tier 1 — flat goal feels bad but validates physics) and drop **DebugOverlay** from Tier 0 (use hardcoded constants + page reload; add dat.gui in week 1 day 2). That leaves 14 systems and a realistic chance of validating the cabezazo-gol hypothesis in one sitting. The hypothesis is "is cabezazo+gol fun" — JuiceController is not on the critical path to answering that.

**Non-blocking observations (no action required):**
- Special vs PlayerCharacter separation is correct — Special needs catalog/swap-ability, PlayerCharacter is generic. Good seam.
- HUD vs Renderer separation is justified IF you adopt the Drawable contract (point 2). Otherwise it's bureaucratic — fold HUD into Renderer.
- No inverted dependencies detected. Foundation is genuinely zero-coupling.
- No hidden cycles via EventBus — the Special → 'special-fired' → JuiceController resolution is the right pattern; apply it consistently.

**Position on open question (single-file vs modular for Tier 0):** Start **modular from line 1**. ES modules in vanilla JS have zero build cost (just `<script type="module">`), and the dependency graph above only works if files match the layer structure. Single-file refactor-later is a trap for first-time devs — by the time you "validate the feel" you'll have 800 lines of tangled globals and refactoring will take longer than the original sitting. The cost of `import { tuning } from './tuning.js'` is literally zero. Lock this in an ADR.

**Implementation sequencing:** Verified buildable in dependency order. Foundation → Core → Feature → Presentation → Polish has no forward references in the listed graph.

**Implicit shared state inventory:** Tuning object (mutable, fine), MatchState.activeMatch (fine, owned), GameLoop.timeScale (per point 1, must be owned), EventBus listener registry (cleanup discipline required — document in EventBus GDD: every system needs an `unsubscribeAll()` for state transitions).
