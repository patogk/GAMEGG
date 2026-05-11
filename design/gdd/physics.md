# GDD — Physics

*Created: 2026-05-11*
*Layer: Core · Priority: MVP (Tier 0) · Critical*

## 1. Overview

Physics es el integrador 2D del juego. Toma entidades con shape `{x, y, vx, vy, mass, radius?}`, aplica gravedad, fricción de aire, y avanza la simulación con integración semi-implicit Euler a paso fijo (1/120s sub-step provisto por GameLoop). Expone una **API frozen de Modifier plugin** (`registerModifier`) para que ModifierSystem altere comportamiento sin tight-coupling. NO contiene lógica de colisión (eso es Collision system) — solo integración.

## 2. Player Fantasy

Sirve **PESO Y JUICE SOBRE TODO** (P4): el feel "pesado y satisfactorio" del cabezazo proviene de la integración correcta y de tunings agresivos (alta gravedad, alta velocidad inicial, baja restitución). El balón debe sentirse como un disco de hockey, no como un globo de playa. Sirve también **VARIEDAD QUE PROVOCA RISA** (P5): los modifiers (low-gravity, no-ball-gravity, etc.) operan vía esta capa.

## 3. Detailed Rules

- Cada entidad física tiene shape mínimo: `{x, y, vx, vy, mass, gravityScale}`. Opcionalmente `radius` (para circle entities) o `width/height` (para AABB).
- API: `registerEntity(entity)`, `unregisterEntity(entity)`, `step(dt)`, `registerModifier(modifier)`, `unregisterModifier(modifier)`.
- `step(dt)` es llamada por GameLoop una vez por sub-step (`dt = FIXED_DT_S = 1/120s`). Procesa todas las entidades registradas:
  1. **Pre-integrate hook** (modifiers): para cada modifier, si tiene `onPreIntegrate(entity, dt)`, llamar.
  2. **Aplicar gravedad:** `entity.vy += gravity × entity.gravityScale × dt`.
  3. **Aplicar fricción aire:** `entity.vx *= airFriction^dt` (estable a cualquier dt — usa `Math.pow`). Igual para `vy` con `airFrictionVertical`.
  4. **Integrar posición:** `entity.x += entity.vx × dt; entity.y += entity.vy × dt` (semi-implicit: usa la velocidad ya actualizada).
  5. **Post-integrate hook** (modifiers): para cada modifier, si tiene `onPostIntegrate(entity, dt)`, llamar.
- **Modifier plugin contract (FROZEN, per TD-SYSTEM-BOUNDARY concern #3):**
  - `onPreIntegrate(entity, dt)` — invocado antes de gravedad. Puede mutar `entity.vx`, `entity.vy`, `entity.gravityScale`. Útil para wind, low-gravity field-wide, etc.
  - `onPostIntegrate(entity, dt)` — invocado después de integrar. Puede mutar `entity.x`, `entity.y` (teleport, wrap). Cuidado: rompe la suavidad si se usa mal.
  - `onCollisionResolve(manifold)` — invocado por Collision system tras detectar choque, antes de aplicar impulse. Puede multiplicar/cambiar el impulse. Útil para bouncy-walls, dampener, etc.
  - **No otros hooks.** Modifiers que necesiten más se reconsideran como sistemas dedicados.
- Physics NO maneja colisiones (eso es Collision). Tras `step()`, GameLoop llama Collision en el mismo sub-step.
- Posiciones en **píxeles del mundo** (mismo sistema que rendering — mantiene simplicidad). Velocidades en **píxeles/segundo**.
- **No rotación.** Entidades son point-particles con (opcional) radio. El "spin" del balón es visual fake (Renderer rota un decorativo dentro del círculo).

## 4. Formulas

**Integrador semi-implicit Euler:**
```
vy_new = vy_old + g × scale × dt
vx_new = vx_old × airFriction^dt
y_new  = y_old + vy_new × dt
x_new  = x_old + vx_new × dt
```

**Variables y unidades:**
- `g` — gravedad (`tuning.physics.gravity`), default `1800 px/s²`. Rango seguro: [800, 4000].
- `scale` — `entity.gravityScale`, default `1.0`. Rango: [0, 5]. Modifier `low-gravity` setea a 0.3.
- `airFriction` — `tuning.physics.airFriction`, default `0.4` (significa: por segundo, vx se reduce a 40% del original; muy alta fricción). Rango: [0.1, 0.99]. ⚠️ aplicado como `Math.pow(airFriction, dt)` por estabilidad framerate-independent.
- `dt` — sub-step de GameLoop, fijo `1/120s = 0.00833s`.

**Ejemplo numérico:**
- Cabeza con `vy = 0`, gravedad `1800 px/s²`, scale `1.0`, dt `0.00833s`:
  - `vy_new = 0 + 1800 × 1 × 0.00833 ≈ 15 px/s` por sub-step
  - `y_new = 0 + 15 × 0.00833 ≈ 0.125 px`
  - Tras 120 sub-steps (=1s): `vy ≈ 1800 px/s`, `y ≈ 900 px` (caída libre — coincide con ½ × g × t²).

**Air friction estabilidad:**
- Sin `Math.pow`: `vx *= 0.4 × dt` produce `vx *= 0.0033` por sub-step → vx muere en milisegundos. ❌
- Con `Math.pow`: `vx *= Math.pow(0.4, dt) ≈ 0.9924` por sub-step → vx pierde ~0.76% por sub-step → ~60% en 1s ✓

## 5. Edge Cases

- **dt = 0 o negativo:** retornar inmediatamente sin step. Defensa contra bugs en GameLoop.
- **Velocidad explota a infinito (NaN):** detectar al final de step, log error, resetear `vx = vy = 0` para esa entidad. Evita que un bug físico congele el juego.
- **Entidad con `mass = 0`:** tratada como kinematic (no recibe gravedad ni colisión-impulse, pero sí integra posición vía `vx/vy`). Útil para entidades dirigidas por código (post-Tier-0).
- **Modifier muta `entity.vx` a NaN/Infinity:** Physics detecta tras `onPostIntegrate` y resetea. Log warning con nombre del modifier.
- **Entity registrada 2 veces:** `registerEntity` es idempotente (chequea Set). No duplicar steps.
- **Modifier registrado y entity destruida:** modifier sigue en lista pero `step()` itera entidades vivas, no modifiers que las referencian. OK.
- **Sub-step con muchísimas entidades (100+):** budget se rompe. MVP cap: ≤10 entidades activas (2 players + 1 ball + ≤6 particles físicas + slack). Validado en perf budget.
- **Sleep/wake (entidades quietas no necesitan integrarse):** NO implementado en Tier 0/1. Cap de entidades hace innecesario optimizar. Agregar post-vertical-slice si perf lo pide.

## 6. Dependencies

- **Depende de:** Tuning, GameLoop (es invocado por sub-step).
- **Es dependido por:** Collision (consume las posiciones/velocidades post-integrate), PlayerCharacter (registra su entity al spawn), Ball (ídem), ModifierSystem (registra modifiers), AIController (lee posición de Ball), Renderer (lee posición para dibujar).
- **Bidireccional con:** Collision GDD debe mencionar Physics como integrador previo. ModifierSystem GDD debe mencionar el plugin contract de Physics.

## 7. Tuning Knobs

| Knob | Default | Rango seguro | Afecta |
|---|---|---|---|
| `physics.gravity` | 1800 px/s² | [800, 4000] | "Peso" general. <1200 = floaty (anti-pillar P4). >2800 = caída instantánea, jumps imposibles. |
| `physics.airFriction` | 0.4 (per second) | [0.1, 0.99] | Cuánto se desacelera horizontalmente. <0.1 = casi cero fricción (resbaloso). >0.9 = se detiene rápido. |
| `physics.airFrictionVertical` | 0.95 | [0.5, 1.0] | Drag vertical separado (terminales más altas). 1.0 = sin drag vertical. |
| `physics.maxVelocity` | 3000 px/s | [1500, 6000] | Cap defensivo a velocidad por axis. Previene velocidades absurdas que romperían colisión (tunneling). |
| `physics.subStepsPerSecond` | 120 | [60, 240] | Definido en GameLoop pero re-leído aquí. Más alto = mejor precisión, peor perf. |

## 8. Acceptance Criteria

- ✅ Una entidad con `vy=0, gravityScale=1` cae con aceleración constante `tuning.physics.gravity` (medido: tras 1s, `vy ≈ gravity`, `y ≈ gravity/2`).
- ✅ Una entidad con `vx=500, vy=0, gravityScale=0` (sin gravedad) tras 1s con `airFriction=0.4`: `vx ≈ 200 px/s` (= 500 × 0.4¹).
- ✅ Cambiar `tuning.physics.gravity` en runtime → el siguiente sub-step usa el valor nuevo (regla "tuning.X at use site").
- ✅ Registrar modifier con `onPreIntegrate(e, dt) => e.gravityScale = 0.3` → todas las entidades caen 3x más lento.
- ✅ Registrar modifier que setea `entity.vx = NaN` → Physics resetea a 0 y loguea warning con nombre del modifier; juego sigue corriendo.
- ✅ Cap de velocidad: setear `vy = 10000` → tras step, `vy === tuning.physics.maxVelocity` (3000 default).
- ✅ Modifier plugin contract: solo `onPreIntegrate`, `onPostIntegrate`, `onCollisionResolve` son llamados. Otros métodos en el modifier object son ignorados.
- ✅ Con 10 entidades activas + 3 modifiers, `step()` ejecuta en <2ms (medido con `performance.now()`).
- ✅ Determinismo: con la misma seed de inicio (mismas posiciones/velocidades) y mismo número de sub-steps, los resultados son bit-idénticos (no usa randoms internos).
- ✅ Re-registrar la misma entidad 2 veces resulta en 1 sola integración por sub-step (idempotente).
