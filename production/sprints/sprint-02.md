# Sprint 02 — Tier 1 Week 2-3: Gameplay Depth + Match Flow

*Created: 2026-05-11*
*Duration: ~1-2 weeks (solo dev, evenings)*
*Goal: Cierre del MVP Tier 1 — el juego completo de "MENU → escoger personaje + modifier → partida → resultado → revancha".*

## Hypothesis under test
> Con specials + modifiers + selección de personaje, ¿el juego sostiene **una sesión de 10 partidas seguidas** sin que se sienta repetitivo?

## Sprint goal
Completar el ciclo de match completo y la capa de expresión (specials + modifiers) que diferencia a este juego de Head Soccer original.

## Tasks (ordered)

| # | Task | System | Estimate | Notes |
|---|---|---|---|---|
| 1 | Characters catalog | `game/characters.js` | 1h | 4 personajes (P1+P2 inicial). Cada uno: id, name, color, mouthShape, specialType, taunt corto. |
| 2 | Special system | `game/special.js` | 3h | Función trigger por tipo. 4 specials: `fire-impulse`, `mega-jump`, `freeze-dash`, `magnet-pull`. Cap "1 botón, 1 efecto" (PR-SCOPE). Cooldown vía `specialCooldownEndsAt` en PlayerCharacter. |
| 3 | ModifierSystem + 3 modifiers | `game/modifiers.js` | 3h | Catalog: `low-gravity`, `giant-ball`, `tiny-goal`. Usa Physics plugin API (ADR-003) para low-gravity. Aplica directo al mundo para giant-ball/tiny-goal en match-start. Cap 1 activo por partida. |
| 4 | MainMenu | `ui/main-menu.js` | 2h | Title screen, "Press any key" → CHAR_SELECT. Drawable contract. |
| 5 | CharacterSelect | `ui/char-select.js` | 4h | 2 columnas P1/P2, navegar con left/right del jugador, confirmar con jump. Modifier roulette debajo (animación 2s, lanza random de pool). Cuando ambos confirman → COUNTDOWN → PLAYING. |
| 6 | ResultScreen (full) | `ui/result-screen.js` | 2h | Reemplaza el bloque de HUD: pantalla completa, winner card, "Revancha" / "Volver al menú". |
| 7 | MatchState extensiones | `game/match-state.js` | 1h | Añadir phases MENU, CHAR_SELECT, COUNTDOWN. Transiciones via método `goto(phase)`. |
| 8 | Wire main.js | `main.js` | 1h | Crear screens, alternar drawables visible según phase, persistir choices en MatchState. |
| 9 | Smoke + commit | `production/qa/smoke-sprint-02.md` | 30min | Headless tests para specials + modifiers + state machine. |

**Total ~17h.** Si explota: cortar `magnet-pull` (special más complejo, sale fácil) y `freeze-dash` → quedan solo 2 specials (fire-impulse / mega-jump) y nos enfocamos en el flow.

## Definition of Done

- [ ] MainMenu visible al boot
- [ ] CharacterSelect permite a P1 y P2 escoger uno de 4 personajes
- [ ] Modifier roulette gira y se queda en uno random visible
- [ ] Cuando ambos confirman, countdown 3-2-1 y comienza la partida
- [ ] Cada personaje tiene su special funcional con cooldown visible (HUD)
- [ ] Special-G / Special-`,` dispara la habilidad del personaje
- [ ] Modifier seleccionado tiene efecto observable en gameplay
- [ ] ResultScreen al terminar el timer: muestra ganador, R = revancha (vuelve a CHAR_SELECT con misma selección), Esc = menu
- [ ] Smoke pasa: specials respetan cooldown, modifier `low-gravity` reduce gy del ball, state machine en orden
- [ ] Sin regresiones a Sprint 01 (juice + audio + particles funcionan en gol)

## Out of scope (Sprint 03+)
- KeyboardCalibration
- IA single-player
- 5to-8vo personaje
- More modifiers (bouncy-walls, lava-floor, no-ball-gravity, multi-ball)
- Settings menu
- Rebindable keys
- Replay system (sigue siendo `dt *= 0.15` + ResultScreen winner highlight)

## Risks

| Riesgo | Mitigación |
|---|---|
| Modifier `giant-ball` mid-match rompe colisión | Aplicar solo en `ball.reset()` al match-start (Ball GDD edge case ya lo flagea). |
| Modifier `tiny-goal` requiere mutar AABBs registrados en Collision | Collision necesita API `updateGoal(side, yTop)`. Añadir al sistema. |
| Special hitbox raro (fire-impulse aplica al balón aunque esté lejos) | Limit fire-impulse a balones dentro de `tuning.special.fireImpulseRange` (300px default). |
| CharacterSelect input se cruza con InputBus normal | CharSelect suscribe a los mismos eventos `'pX-move-left-pressed'` etc. — funciona pero solo procesa cuando phase===CHAR_SELECT. |
| Modifier roulette animación es muy larga | Cap 2s, dejar al jugador skipear con jump. |

## Sprint Director sign-off

> **PR-SPRINT:** Skipped — solo dev, deriva directa de gates ya aprobados.
