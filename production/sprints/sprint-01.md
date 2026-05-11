# Sprint 01 — Tier 1 Week 1: Juice + Tuning Infrastructure

*Created: 2026-05-11*
*Duration: ~1 week (solo dev, evenings)*
*Goal: Make goals FEEL the way pillar P4 demands.*

## Hypothesis under test
> When P4 ("PESO Y JUICE SOBRE TODO") is fully wired in — slow-mo on goal, screen shake, hit particles, audio cue — does the Tier 0 prototype transform from "OK physics" to "I want to play another round"?

## Sprint goal
Ship everything that makes a goal **feel cinemático** + give the dev fast iteration via dat.gui. This is the lowest-cost, highest-impact week per TD-FEASIBILITY ("juice is where the game lives").

## Tasks (ordered by dependency)

| # | Task | System | Estimate | Notes |
|---|---|---|---|---|
| 1 | DebugOverlay con dat.gui | `tools/debug-overlay.js` | 2h | TD-FEASIBILITY constraint: dat.gui en semana 1. CDN script, toggle backtick. Sliders para todo `tuning.*`. |
| 2 | JuiceController + supersede ADR-004 | `game/juice.js` | 3h | Suscribe a `'goal-scored'`, `'ball-hit-head'`, `'pX-special-fired'` (futuro). Owns slow-mo + shake. Reemplaza el inline hitstop de main.js. |
| 3 | Screen shake en RenderContext | `engine/render-context.js` extension | 1h | API `setShake(intensityPx, durationMs)` consumida por Renderer (translate antes de drawables). |
| 4 | ParticleSystem | `render/particles.js` | 3h | Pool capped a 50, Drawable. Tipos: hit-spark, ball-trail, goal-explosion. |
| 5 | AudioContext + AudioPlayer + 6 SFX sintéticos | `engine/audio-context.js`, `engine/audio-player.js` | 3h | Sin assets — todos los SFX vía WebAudio oscillators + envelopes. Cubre kick, jump, hit-floor, hit-wall, goal, whistle. |
| 6 | Wire eventos → juice + audio en main.js | `main.js` | 30min | Pegamento. |
| 7 | Smoke check + commit | `production/qa/smoke-sprint-01.md` | 30min | Validar arquitectura, no regresiones a Tier 0 funcional. |

**Total: ~13h** distribuidas en evenings. Si una tarea explota, recortar #4 (particles) — es la única que no es bloqueante para validar el pillar P4.

## Definition of Done

- [ ] dat.gui aparece al presionar backtick, oculto al inicio
- [ ] dat.gui modifica `tuning.physics.gravity` en runtime y el juego responde sin reload
- [ ] JuiceController owns hitstop (line removida de main.js)
- [ ] Al meter gol: hitstop ≥400ms + slow-mo 600ms (`dt *= 0.15`) + screen shake + sonido de gol
- [ ] Al cabezazo fuerte: micro-shake + spark + sonido de hit
- [ ] Particle pool nunca excede 50 simultaneas (perf cap)
- [ ] WebAudio no autoplay errors en Chrome (lazy-init on first input)
- [ ] Frame budget 60fps mantenido en escena worst-case (2 players + ball + 30 particles simultaneas)
- [ ] ADR-004 marcada como Superseded
- [ ] Smoke check pasa: physics + collision + match no regresan, eventos correctos

## Out of scope for Sprint 01
- Specials por personaje (Sprint 02)
- Modifiers (Sprint 02)
- MainMenu / CharacterSelect / ResultScreen (Sprint 02-03)
- KeyboardCalibration (Sprint 02)
- IA (Sprint 04 / Vertical Slice)
- Audio assets reales (post-Sprint-01 cuando haya sound designer)

## Risks

| Riesgo | Mitigación |
|---|---|
| dat.gui no carga via CDN | Fallback: hardcode tuning + reload page. No bloquea otras tareas. |
| WebAudio oscillator SFX suenan baratos | Aceptable Sprint 01. Sound designer reemplaza con samples reales en Sprint 02+. |
| Screen shake durante slow-mo "siente raro" | Tuning knob `juice.shakeRespectsTimeScale: false` por default (shake al ritmo wall-clock independiente). Probar y ajustar. |
| Particle perf cliff (>50 con glow blits) | Cap duro + log warning si rebasa. Reducir cap si frame budget se rompe. |

## Sprint Director sign-off

> **PR-SPRINT:** Pending — solo mode would skip; full mode requires producer review.

Por simplicidad (solo dev, Sprint 01 chico, todo deriva de gates anteriores ya aprobados), skip producer gate. Si la complejidad sube en Sprint 02, retomar.
