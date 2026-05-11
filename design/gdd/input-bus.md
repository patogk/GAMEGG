# GDD — InputBus

*Created: 2026-05-11*
*Layer: Foundation · Priority: MVP (Tier 0) · Critical*

## 1. Overview

InputBus es la capa única de entrada: escucha `keydown`/`keyup` del documento, mantiene un mapa por-frame de teclas presionadas (`pressed`, `justPressed`, `justReleased`), traduce la tecla física a evento semántico (`'p1-jump-pressed'`, `'p2-special-pressed'`, etc.) y publica al EventBus. Implementa el layout 6KRO-safe definido en `tuning.js` y es la única fuente de verdad de input en el juego — ningún sistema lee directamente del DOM.

## 2. Player Fantasy

Invisible. La fantasía servida es **DOS BOTONES, MIL JUGADAS** (P2): la responsividad debe ser <16ms del press físico al efecto en pantalla. Cero lag percibido. El jugador no debe NUNCA pensar "oprimí pero no respondió". También sirve **EL PIQUE ES EL JUEGO** (P3) garantizando que ambos jugadores en el mismo teclado no pierdan inputs simultáneos.

## 3. Detailed Rules

- Listener global `window.addEventListener('keydown'|'keyup', ...)` en `init()`. `event.preventDefault()` para teclas mapeadas (evita scroll con Space, navegación con flechas).
- Estado interno: `Set<keyCode>` para `pressed`, `Set<keyCode>` para `justPressed` (limpia cada frame), `Set<keyCode>` para `justReleased` (limpia cada frame).
- API por-frame consultiva: `isPressed(action)`, `wasJustPressed(action)`, `wasJustReleased(action)` donde `action` es semántica (`'p1-jump'`, `'p2-special'`, etc.).
- API por-evento: cada `keydown` que coincide con un mapping emite `'<action>-pressed'` al EventBus (ej. `'p1-jump-pressed'`). Cada `keyup` emite `'<action>-released'`.
- `tick()` llamado por GameLoop al final de cada frame: limpia `justPressed` y `justReleased`. **Nunca** limpia `pressed`.
- Mapping definido en `tuning.input.bindings`. Cada binding: `{action: 'p1-jump', code: 'KeyW'}` (usa `event.code`, no `event.key`, para layout-independencia).
- **Layout 6KRO-safe default (TD-FEASIBILITY constraint):**
  - P1: `KeyA`/`KeyD` (move) · `KeyW` (jump) · `KeyG` (kick/special)
  - P2: `ArrowLeft`/`ArrowRight` (move) · `ArrowUp` (jump) · `Comma` (kick/special)
  - Pause global: `Escape`
  - Debug overlay: `Backquote` (`` ` ``) — Tier 1+
- **Repeat suppression:** algunos browsers disparan `keydown` repetido al mantener tecla. InputBus filtra: si `event.repeat === true`, ignorar para `justPressed` (mantener `pressed = true`).
- **Focus loss:** al `window.blur`, limpiar TODO el estado (sets vacíos) y emitir `'all-inputs-released'` al EventBus. Evita "tecla pegada" tras Alt-Tab.

## 4. Formulas

InputBus es event-driven, no tiene fórmulas matemáticas significativas. Su único cálculo:

- **Mapping reverso** (lookup `code → action`): pre-calculado al `init()` como `Map<string, string>` para O(1) por evento.
- **Latency presupuesto:** `keydown event → EventBus emit → suscriptor recibe → next frame render` debe ser ≤ 16.67ms (1 frame). En la práctica: <2ms para el path JS, el resto es el frame budget normal.

## 5. Edge Cases

- **Misma tecla mapeada a múltiples actions:** `init()` debe rechazar y log `console.warn`. La regla: 1 code → 1 action máx.
- **Action mapeada a múltiples codes:** permitido y deseable (ej. P1 jump = `KeyW` o `Space`). Cualquier code activa la action; `pressed` queda true mientras AL MENOS uno esté pressed.
- **6KRO drop detectado en runtime (P1 mantiene 3 teclas + P2 oprime 4ta):** InputBus NO puede detectarlo directamente desde JS (browser ya filtró). Se detecta en `KeyboardCalibration` al boot mediante un test deliberado. Si calibración detectó drops, se setea `tuning.input.knownRollover = true` y se muestra warning en HUD.
- **Tecla soltada mientras tab pierde foco, regresada presionada al volver:** `blur` limpia el set, pero al volver el browser NO re-dispara `keydown` (el state real es "ya estaba presionada"). Mitigación: pedir al usuario "presioná de nuevo" mediante un overlay sutil al re-foco (Tier 1).
- **Múltiples listeners de la misma action:** EventBus debe soportar pub/sub multi-listener; InputBus emite una vez, todos los suscriptores reciben.
- **`event.code` no existe en navegadores antiguos:** documentado en tech-prefs; soportamos solo navegadores modernos (last 2 versions). Fallback a `event.key` no se implementa.
- **Tecla de una action emitida ANTES de que ningún sistema esté suscrito:** evento se pierde silenciosamente. Documentado: InputBus debe inicializarse DESPUÉS de que EventBus esté listo y los suscriptores hayan registrado handlers (orden en `main.js`).

## 6. Dependencies

- **Depende de:** EventBus (publica eventos), Tuning (lee `tuning.input.bindings`), GameLoop (llama `tick()` por frame).
- **Es dependido por:** PlayerCharacter (suscribe a `'pX-*-pressed'`), KeyboardCalibration (modo raw para test 6KRO), MainMenu/CharacterSelect/ResultScreen (suscriben a `'p1-jump-pressed'` para "confirmar"), DebugOverlay (toggle con backtick).
- **Bidireccional con:** Tuning GDD debe mencionar InputBus como consumer de `tuning.input.bindings`.

## 7. Tuning Knobs

| Knob | Default | Rango seguro | Afecta |
|---|---|---|---|
| `input.bindings` | (objeto, ver "Detailed Rules") | — | Layout completo. Mutable post-Tier-1 vía Settings. |
| `input.knownRollover` | false | true/false | Set por KeyboardCalibration. Activa warning HUD si true. |
| `input.preventDefaultActions` | true | true/false | Si false, browser maneja Space (scroll) y Arrows (scroll) — útil para debug, NUNCA en producción. |
| `input.suppressRepeat` | true | true/false | Filtrar `event.repeat`. False solo para testing rapid-fire en debug. |

## 8. Acceptance Criteria

- ✅ Presionar `W` → en el siguiente frame, `wasJustPressed('p1-jump') === true` y EventBus recibió evento `'p1-jump-pressed'` exactamente 1 vez.
- ✅ Mantener `W` 1 segundo → `isPressed('p1-jump') === true` durante todo ese segundo; `'p1-jump-pressed'` emitido 1 sola vez (suppressed repeat).
- ✅ Soltar `W` → `wasJustReleased('p1-jump') === true` ese frame y EventBus emite `'p1-jump-released'`.
- ✅ Presionar `W`, `A`, `D`, `G` (P1) + `↑`, `←`, `→`, `,` (P2) simultáneamente → cada action queda `pressed = true`. Si keyboard rollover dropea inputs, KeyboardCalibration lo detecta (no InputBus directamente).
- ✅ Alt-Tab fuera de la página → `'all-inputs-released'` emitido + todos los sets vacíos.
- ✅ Cambiar `tuning.input.bindings` en runtime via DebugOverlay → próxima `init()` (o tras un `rebind()`) usa el nuevo binding.
- ✅ Latencia <2ms desde `keydown` event hasta EventBus emit (medido con `performance.now()`).
- ✅ `event.preventDefault()` activo: presionar Space NO scroll-down la página, presionar `↓` NO scroll-down.
- ✅ Después de `tick()`: `justPressed.size === 0` y `justReleased.size === 0`.
