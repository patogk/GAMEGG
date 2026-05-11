# Technical Preferences

<!-- Configured manually for MEGA HEAD CUP — Vanilla JS + Canvas 2D web project. -->
<!-- The CCGS /setup-engine skill does not natively support custom web stacks; this file was hand-filled to match. -->

## Engine & Language

- **Engine**: None (custom). HTML5 Canvas 2D for rendering, Vanilla JS for everything.
- **Language**: JavaScript (ES2022+), native ES modules (`<script type="module">`)
- **Rendering**: Canvas 2D context (`getContext('2d')`); no WebGL in MVP. `globalCompositeOperation = 'lighter'` + pre-rendered radial gradients for glow.
- **Physics**: Custom 2D — semi-implicit Euler integrator, fixed timestep accumulator (1/120s sub-steps), circle-circle (ball-head/foot) + AABB (ground/posts/walls) collision, restitution 0.6, air friction 0.99.

## Input & Platform

- **Target Platforms**: Web / Browser (desktop only in MVP — not optimized for mobile touch)
- **Input Methods**: Keyboard only (2 players same keyboard)
- **Primary Input**: Keyboard
- **Gamepad Support**: None (post-v1, optional via `Gamepad API`)
- **Touch Support**: None (post-v1)
- **Platform Notes**:
  - 2-player same-keyboard requires **6KRO-safe key layout** to avoid USB HID rollover drops:
    - **P1**: `W` (jump) / `A` `D` (move) / `G` (kick/special)
    - **P2**: `Arrow Up` (jump) / `Arrow Left` `Arrow Right` (move) / `,` (kick/special)
  - Boot sequence MUST include keyboard calibration screen ("press all your buttons together") with rollover-drop detection and a warning if drops occur.
  - Web Audio: lazy-init `AudioContext` on first user gesture (Chrome/Safari autoplay policy).

## Naming Conventions

- **Classes**: PascalCase (`Ball`, `Player`, `MatchController`)
- **Variables**: camelCase (`ballVelocity`, `jumpForce`)
- **Constants** (true compile-time): UPPER_SNAKE_CASE (`MAX_PLAYERS`, `FIXED_TIMESTEP`)
- **Tuning numbers**: lowercase camelCase in `tuning.js` (`gravity`, `restitution`, `kickImpulse`)
- **Files**: kebab-case (`match-controller.js`, `ball-physics.js`); one main exported class per file, file name matches class name
- **Functions**: camelCase verb-first (`updateBall`, `handleCollision`, `triggerSlowMo`)
- **Events** (custom event bus): kebab-case (`'goal-scored'`, `'ball-hit-head'`, `'special-fired'`)
- **CSS classes** (UI overlay HTML): kebab-case BEM-light (`hud-score`, `hud-score__p1`)

## Performance Budgets

- **Target Framerate**: **60fps locked** (hard cap per pillar 4)
- **Frame Budget**: **16.67ms total** — split: ≤4ms physics (multiple sub-steps), ≤8ms render (Canvas 2D ops + glow), ≤2ms input/events, 2ms slack
- **Render budget specifics**:
  - Max ~50 active particles simultaneously
  - Glow via additive composite + cached radial gradients (NEVER `shadowBlur` per draw — too expensive)
  - Screen shake = camera offset (no full re-render)
- **Memory Ceiling**: <50MB total (web context); audio buffers <10MB
- **Asset payload**: index.html + JS + minimal audio < 2MB total for instant web load
- **Slow-mo behavior**: time-scale `dt *= 0.15`, NOT pause; physics keeps stepping (preserves responsiveness)

## Testing

- **Framework**: None heavy in MVP — `node:test` (built-in) for pure-function unit tests if needed (physics math, scoring logic)
- **Minimum Coverage**: No coverage target. Required: physics math (`integrateVelocity`, `circleCollide`), scoring/match-state transitions, modifier composition
- **Manual play-testing**: every change → reload `index.html`, run a 90s match
- **Performance regression**: dat.gui overlay shows live frame time; manual eyeball check after every juice change. Profile with Chrome DevTools.

## Forbidden Patterns

- ❌ **`shadowBlur` per-frame in render loop** — kills 60fps budget. Use additive composite + pre-rendered gradients.
- ❌ **Build steps / bundlers in MVP** (no Webpack, Vite, Parcel) — keep zero-build philosophy. ES modules native.
- ❌ **Frameworks** (no React, Vue, Phaser, etc.) — vanilla JS only. Anti-pattern for our scope.
- ❌ **`<audio>` HTML element** — use Web Audio API (`AudioContext`, `BufferSource`) for latency control.
- ❌ **`setTimeout` / `setInterval` for game timing** — use `requestAnimationFrame` + `performance.now()` only.
- ❌ **Magic numbers in physics/feel code** — all goes in `tuning.js`.
- ❌ **Hitstop on common actions** (movement, casual ball touches) — only on goals/specials/parry per pillar 2↔4 resolution.
- ❌ **Tutorial screens** — onboarding is in-world only (per pillar 2 design test).
- ❌ **Server / network code in MVP** — local only.
- ❌ **Frame capture / GIF encoding for replay** — `dt *= 0.15` slow-mo only (per TD-FEASIBILITY cut).

## Allowed Libraries / Addons

- ✅ **dat.gui** (CDN) — debug tuning overlay only, hidden behind ` ` ` ` ` toggle. Stripped from production build.
- ⚠️ **No other dependencies in MVP.** Each addition needs explicit ADR.

## Architecture Decisions Log

<!-- Quick reference linking to full ADRs in docs/architecture/ -->
- [No ADRs yet — use /architecture-decision after /create-architecture]

## Engine Specialists

<!-- This project uses a custom web stack; CCGS engine-specialists (godot-*, unity-*, unreal-*) do NOT apply. -->
<!-- Routing falls back to general specialists from .claude/agents/. -->

- **Primary**: N/A (no engine — custom JS)
- **Language/Code Specialist**: `gameplay-programmer` (general game code in JS)
- **Shader Specialist**: N/A (Canvas 2D only; no shader code in MVP)
- **UI Specialist**: `ui-programmer` (HTML overlay + Canvas-rendered HUD)
- **Additional Specialists**: `engine-programmer` (game loop, render loop, input bus), `tools-programmer` (dat.gui tuning overlay, debug helpers)
- **Routing Notes**: Skip all godot-* / unity-* / unreal-* agents. Skip godot-shader-specialist / unity-shader-specialist / godot-gdextension-specialist. For physics or perf review use `engine-programmer` + `performance-analyst`.

### File Extension Routing

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| `*.js` (game logic) | `gameplay-programmer` |
| `src/engine/*.js` (loop, render, input, physics) | `engine-programmer` |
| `src/ui/*.js`, `*.html`, `*.css` | `ui-programmer` |
| `src/tools/*.js` (dat.gui overlay, debug) | `tools-programmer` |
| Audio files (`*.wav`, `*.mp3`, `*.ogg`) | `sound-designer` |
| General architecture review | `lead-programmer` |
