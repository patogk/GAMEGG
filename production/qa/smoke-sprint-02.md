# Smoke Check — Sprint 02 (Tier 1 wave 2)

*Date: 2026-05-11*
*Branch: `claude/install-game-studios-YYj94`*
*Build under test: Sprint 02 (Specials + Modifiers + Menus + Match Flow)*

## Test results (12/12 PASS)

| # | Test | Result |
|---|---|---|
| T1 | 4 characters in catalog | **PASS** |
| T2 | `getCharacterById` resolves all 4 ids | **PASS** |
| T3 | `fire-impulse` fires when player in range, applies vx=1400 | **PASS** |
| T4 | Special respects cooldown (2nd call blocked) | **PASS** |
| T5 | Out-of-range `fire-impulse` does not fire (no vx change) | **PASS** |
| T6 | `mega-jump` applies vy=-1500 to player | **PASS** |
| T7 | Modifier `low-gravity` reduces entity gravityScale to 0.35 | **PASS** |
| T8 | Modifier `giant-ball` doubles `ball.radius`; `clear()` restores | **PASS** |
| T9 | Modifier `tiny-goal` shrinks goal yTop; `clear()` restores | **PASS** |
| T10 | MatchState phase transitions MENU → CHAR_SELECT → COUNTDOWN → PLAYING | **PASS** |
| T11 | `pickRandomModifier()` never returns `'none'` (30 trials) | **PASS** |
| T12 | `setSelection()` persists p1/p2/modifier choice | **PASS** |

## File integrity
- **25/25 files** served HTTP 200 OK from `python3 -m http.server`
- **24/24 JS files** pass `node --check` syntax validation

## Project file count delta
- Sprint 01: 18 source files
- Sprint 02: **25 source files** (+7: characters, special, modifiers, main-menu, char-select, result-screen, hud rewrite)

## Sprint 02 Definition of Done — review

| DoD item | Status |
|---|---|
| MainMenu visible al boot | ✅ Implementado (`ui/main-menu.js`, visible only on PHASE.MENU) |
| CharacterSelect 4 personajes | ✅ Implementado, navega L/R confirma jump |
| Modifier roulette gira y se queda en uno | ✅ 2s spin con ease-out, lock al `_rouletteFinal` |
| Countdown 3-2-1-VA tras ambos confirmen | ✅ MatchState.goto(COUNTDOWN), `tuning.match.countdownMs = 3000` |
| Cada personaje tiene su special funcional | ✅ 4 specials (fire-impulse, mega-jump, freeze-dash, magnet-pull) |
| Special tiene cooldown visible en HUD | ✅ Cooldown bars en HUD esquinas inferiores |
| Modifier tiene efecto observable | ✅ low-gravity via Physics plugin, giant-ball/tiny-goal estructurales |
| ResultScreen muestra ganador | ✅ `ui/result-screen.js` con taunt del personaje |
| R = revancha vuelve a CHAR_SELECT | ✅ Wired in main.js |
| Esc = vuelve a MENU | ✅ Wired in main.js |
| Smoke pasa | ✅ 12/12 |
| Sin regresiones Sprint 01 | ✅ Juice/audio/particles wiring intacto |

## Browser-only items (manual playtest pending)
- Visual: ver pantalla MENU al boot, navegar a CHAR_SELECT, ruleta de modifier animada
- Special cooldown bar se llena visualmente
- Tiny-goal: el balón rebota contra una zona alta que antes era gol
- Giant-ball: el balón es visiblemente más grande
- Low-gravity: el balón cae visiblemente más lento
- Countdown 3-2-1 visible antes de la partida

## Verdict
**Sprint 02 logic: APPROVED for browser playtest.** All headless-testable acceptance criteria pass. The full match-flow loop (MENU → CHAR_SELECT → COUNTDOWN → PLAYING → GOAL_PAUSE → RESULT → revancha) is wired end-to-end. Ready to play.

## Tier 1 status post-Sprint-02
- ✅ Full match flow
- ✅ 4 personajes con specials
- ✅ 3 modificadores
- ✅ Juice (slow-mo + shake + flash + hitstop)
- ✅ Audio sintético (8 SFX)
- ✅ Particles (hits + goal explosion)
- ✅ Debug overlay (dat.gui)
- ⏳ Pendiente Sprint 03: KeyboardCalibration (6KRO test al boot) + IA single-player + más modifiers/personajes
- ⏳ Pendiente: assets de audio reales (sound designer) reemplazando los osciladores sintéticos

**MVP Tier 1 prácticamente cerrado** — pendiente solo KeyboardCalibration y polish.
