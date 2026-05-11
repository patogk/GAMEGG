# Smoke Check — Sprint 01 (Tier 1 wave 1)

*Date: 2026-05-11*
*Branch: `claude/install-game-studios-YYj94`*
*Build under test: Sprint 01 (JuiceController + Audio + Particles + DebugOverlay)*

## What was tested

Node ESM smoke test runs the headless-safe systems and verifies no Tier 0 regression + new Tier 1 systems work as specified.

## Results

| # | Test | Expected | Actual | Status |
|---|---|---|---|---|
| T1 | Goal detection still fires after Tier 1 wiring | `'goal-scored'` 1 emit, payload `playerId='p1'` | `playerId='p1'` ✓ | **PASS** |
| T2 | Match state score increments on goal | `ms.scores.p1 === 1` | `1` ✓ | **PASS** |
| T3 | ParticleSystem spawns on `'ball-hit-head'` | active particle count > 0 | n=27 ✓ | **PASS** |
| T4 | ParticleSystem honors pool cap of 50 | active count ≤ 50 after 200 spawn requests | 50 ✓ | **PASS** |
| T5 | Particles decay to zero after lifetime | active count → 0 after simulated 6s | 0 ✓ | **PASS** |
| T6 | `tuning.juice.*` schema present with required keys | 5 required keys exist as numbers | all present ✓ | **PASS** |

## Files served check (HTTP)

```
index.html: 200
src/main.js: 200
src/tuning.js: 200
src/engine/{event-bus,game-loop,input-bus,render-context,audio-context,audio-player}.js: 200
src/game/{physics,collision,match-state,player,ball,juice}.js: 200
src/render/{renderer,hud,particles}.js: 200
src/tools/debug-overlay.js: 200
```

All 18 source files (vs 13 in Tier 0) served correctly.

## Syntax checks (node --check)

18/18 OK. No syntax errors.

## What was NOT tested (real-browser only)

These cannot be smoke-tested headlessly; require manual browser playtest:
- Slow-mo via `loop.setTimeScale(0.15, 600)` actually slows visible motion
- Screen shake offset visible in canvas
- dat.gui CDN loads and sliders mutate `tuning.*` at runtime
- WebAudio SFX play on `'goal-scored'` etc. (autoplay policy + audio output)
- Goal flash overlay paints verde lima full-screen
- Particle glow visible with `globalCompositeOperation = 'lighter'`

**Action item:** when next opening the build in a browser, manually verify:
1. Backtick toggles dat.gui overlay
2. Goal triggers ALL of: hitstop → slow-mo → screen shake → flash → SFX → green particle explosion
3. Cabezazo triggers micro-shake + cyan/magenta sparks + low-thud SFX
4. Tuning a slider (e.g. `physics.gravity`) changes behavior in next frame without reload

## Acceptance vs Sprint 01 DoD

| DoD item | Status |
|---|---|
| dat.gui aparece al presionar backtick | **Implementado** (browser test pending) |
| dat.gui modifica `tuning.physics.gravity` en runtime | **Implementado** (browser test pending) |
| JuiceController owns hitstop (line removida de main.js) | ✅ Inline `pulseHitstop` retirado; JuiceController suscribe a `'goal-scored'` |
| Gol: hitstop + slow-mo + shake + sonido | ✅ Wired (browser test pending para output) |
| Cabezazo fuerte: shake + spark + sonido | ✅ Wired |
| Particle pool ≤ 50 | ✅ T4 PASS |
| WebAudio sin autoplay errors | ✅ AudioCtx usa onFirstGesture pattern |
| 60fps mantenido en worst case | **Browser-only** — measure with DevTools next session |
| ADR-004 marked Superseded | ⏳ Pendiente — actualizar ADR-004 status |
| Smoke check pasa | ✅ 6/6 PASS |

## Verdict

**Sprint 01 logic: APPROVED for browser playtest.** All headless-testable acceptance criteria pass. Browser-only items (visual juice, audio output, dat.gui CDN, frame budget) require manual verification — schedule a playtest session before declaring sprint done.

**Next blocking action:** Mark ADR-004 as Superseded by JuiceController (file edit only).
