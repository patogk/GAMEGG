# GDD — GameLoop

*Created: 2026-05-11*
*Layer: Foundation · Priority: MVP (Tier 0) · Critical*

## 1. Overview

GameLoop es el corazón del runtime: maneja el ciclo `requestAnimationFrame`, ejecuta updates a paso fijo (`1/120s`) y renders a paso variable, y posee el campo `timeScale` que JuiceController manipula vía un setter público para activar slow-mo. En Tier 0 implementa además un `hitstop` inline (pausa de updates por 150ms post-`'goal-scored'`) hasta que JuiceController exista en Tier 1.

## 2. Player Fantasy

Invisible. El loop debe garantizar **60fps locked** sin hipo perceptible incluso durante slow-mo. La fantasía servida es **PESO Y JUICE** (P4): cuando el slow-mo se activa, el jugador siente que "el tiempo se rompe" sin que el juego deje de responder a inputs (solo escala dt, no pausa).

## 3. Detailed Rules

- Loop driven por `requestAnimationFrame(now)`. `now` en ms (sub-ms precision).
- Mantiene `accumulator` en ms. Cada frame:
  1. `frameDelta = clamp(now - lastNow, 0, 250)` (cap evita death-spirals tras tab-blur).
  2. `accumulator += frameDelta * timeScale`.
  3. Mientras `accumulator >= FIXED_DT_MS` (8.333…ms = 1/120s): llamar `update(FIXED_DT_S)`, decrementar `accumulator`. Cap en 6 sub-steps por frame para evitar spirals.
  4. Llamar `render(accumulator / FIXED_DT_MS)` (alpha de interpolación entre 0..1, pasado a Renderer para suavizar entidades).
- `timeScale` rango `[0, 2]`. Default `1`. JuiceController llama `setTimeScale(0.15, 600)` → escala a `0.15` y vuelve a `1` tras 600ms (rampa lineal en últimos 80ms para no cortar el sonido).
- **Hitstop Tier 0 inline:** al recibir `'goal-scored'`, marcar `hitstopUntil = now + 150`. Mientras `now < hitstopUntil`, **NO** llamar `update`, **SÍ** llamar `render` (frame congelado).
- Loop nunca termina mientras la pestaña esté activa. En `visibilitychange → hidden`: setear `paused = true`, drop accumulator. En `visible`: reset `lastNow = performance.now()`.
- API pública: `start(updateFn, renderFn)`, `stop()`, `setTimeScale(target, durationMs)`, `pulseHitstop(ms)`, `getTimeScale()`.

## 4. Formulas

- `FIXED_DT_MS = 1000 / 120 = 8.333...`
- `FIXED_DT_S = 1 / 120 = 0.008333...`
- `frameDelta = min(now - lastNow, 250)`
- `accumulator += frameDelta × timeScale`
- `subSteps = min(floor(accumulator / FIXED_DT_MS), 6)` — cap a 6 evita spirals
- `interpolationAlpha = accumulator / FIXED_DT_MS` ∈ [0, 1) tras los sub-steps
- Easing de rampa de slow-mo (últimos 80ms): `timeScale(t) = lerp(target, 1, (t - rampStart) / 80)` clamped

**Variables:**
- `now`, `lastNow`, `accumulator`, `timeScale`: ms / sin unidad
- `FIXED_DT_MS`: 8.333 (constante)
- `target`: typically 0.15 (slow-mo) o 1.0 (normal)

**Ejemplo:** frame con `frameDelta = 16ms`, `timeScale = 0.15` → `accumulator += 2.4ms` → 0 sub-steps este frame; tras ~3.5 frames se acumulan 8.4ms → 1 sub-step → alpha 0.001 → render casi sin movimiento. Resultado: gameplay corre al 15% del tiempo real.

## 5. Edge Cases

- **Tab perdió foco / blur:** `frameDelta` puede ser enorme (segundos). Clamp a 250ms previene que el accumulator se llene con horas de updates al volver.
- **Sub-step explosion:** si el frame demora >50ms (browser hiccup), accumulator crece. Cap de 6 sub-steps evita que update tome >50ms más, garantizando recuperación.
- **`setTimeScale` llamado mientras ya hay rampa activa:** la nueva llamada **reemplaza** la rampa anterior (no se acumulan). Documentado: la última gana.
- **Hitstop disparado durante slow-mo:** los efectos NO se acumulan multiplicativamente. Hitstop pausa updates totalmente (incluyendo la rampa de slow-mo); al expirar, la rampa continúa desde donde quedó.
- **`FIXED_DT_MS` no divide perfectamente 16.67ms (60fps):** intencional. El acumulador absorbe la diferencia.
- **Múltiples eventos `'goal-scored'` en mismo frame:** segundo se ignora (no extender hitstop). Imposible en juego real (lógica MatchState bloquea), defensa por si bug.

## 6. Dependencies

- **Depende de:** ninguna (Foundation pura).
- **Es dependido por:** Physics (consume FIXED_DT_S), Timer (decrementa con dt), JuiceController (llama setTimeScale/pulseHitstop), Renderer (recibe alpha de interpolación).
- **Bidireccional con:** EventBus suscribe a `'goal-scored'` para hitstop Tier 0 (en Tier 1 esto migra a JuiceController). EventBus GDD debe mencionar GameLoop como suscriptor temporal.

## 7. Tuning Knobs

| Knob | Default | Rango seguro | Afecta |
|---|---|---|---|
| `loop.fixedDtMs` | 8.333 (=1/120) | [4, 16.67] | Precisión de físicas vs costo de CPU. <4 = costoso, >16.67 = jitter visible. |
| `loop.maxSubSteps` | 6 | [3, 10] | Tolerancia a hiccups. Más alto = mejor recuperación, peor caso peor. |
| `loop.maxFrameDeltaMs` | 250 | [100, 1000] | Threshold para drop de accumulator tras tab-blur. |
| `loop.slowmoTarget` | 0.15 | [0.05, 0.5] | Intensidad del slow-mo. <0.1 = casi pausa, >0.3 = apenas se nota. |
| `loop.slowmoRampOutMs` | 80 | [40, 200] | Duración de la rampa de salida. Suaviza la vuelta al 100%. |
| `loop.tier0HitstopMs` | 150 | [50, 400] | Hitstop inline Tier 0 (deprecated en Tier 1 a favor de JuiceController). |

Todos viven en `tuning.js` bajo `tuning.loop.*`. **NUNCA** destructurar a nivel de módulo (regla universal de Tuning).

## 8. Acceptance Criteria

- ✅ Con `update` y `render` no-op, el loop corre estable a 60fps en Chrome/Firefox/Safari (medido con DevTools Performance ≥1min).
- ✅ Inyectar `update` que tarde 4ms y `render` que tarde 8ms → 60fps locked (frame total <16.67ms).
- ✅ Inyectar `update` que tarde 30ms (deliberadamente) → loop NO entra en spiral; sub-steps cap a 6 + frameDelta clamp evitan freeze permanente; recupera a 60fps tras quitar la sobrecarga.
- ✅ Llamar `setTimeScale(0.15, 600)` → `getTimeScale()` retorna 0.15 inmediatamente, sigue 0.15 por 520ms, luego rampa lineal a 1.0 en 80ms.
- ✅ Llamar `pulseHitstop(150)` → updates no se ejecutan por exactamente 150ms (±1 frame); render sigue dibujando frame congelado.
- ✅ Disparar evento `'goal-scored'` en Tier 0 → comportamiento idéntico a `pulseHitstop(tuning.loop.tier0HitstopMs)`.
- ✅ Cambiar de pestaña por 30s y volver → no se ejecutan 30s de updates al regresar; loop continúa normal desde el frame actual.
- ✅ Cambiar `tuning.loop.slowmoTarget` en runtime via DebugOverlay → próximo `setTimeScale(tuning.loop.slowmoTarget, 600)` usa el valor nuevo (regla "tuning.X at use site").
- ✅ Profiler muestra que GameLoop por sí mismo (sin update/render) consume <0.5ms por frame.
