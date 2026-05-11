# GDD — PlayerCharacter

*Created: 2026-05-11*
*Layer: Feature · Priority: MVP (Tier 0) · Critical*

## 1. Overview

PlayerCharacter es la entidad jugable del juego: una cabeza-círculo (per art-bible) controlada por inputs del jugador (P1 o P2). Se mueve izquierda/derecha en el suelo, salta (con coyote-time y jump-buffer), y eventualmente dispara un special (Tier 1). Suscribe a eventos `'pX-*-pressed'` del InputBus, traduce input → intent → mutación de su entity física, y la registra en Physics+Collision. Es kinematic-controlled: la lógica de input domina, pero la gravedad y restricciones de colisión las maneja Physics/Collision.

## 2. Player Fantasy

Sirve directamente **DOS BOTONES, MIL JUGADAS** (P2): mover-saltar-cabecear con dos botones, control absoluto y predecible. Sirve **EL PIQUE ES EL JUEGO** (P3): el control debe ser injustamente bueno — el jugador NUNCA debe perder por culpa del control, solo por habilidad propia. Cero "se atascó", cero "no respondió mi input". Coyote-time + jump-buffer son las herramientas estándar del género platformer para esto.

## 3. Detailed Rules

- Constructor: `new PlayerCharacter({ id: 'p1' | 'p2', spawnX, spawnY, color, special? })`.
- Estado interno: `{ x, y, vx, vy, isGrounded, lastGroundedAt, jumpBufferedAt, facing, specialCooldownEndsAt }`.
- Conecta su `entity` a Physics (`registerCircle`) y Collision (`registerCircle` con layer=HEAD).
- Suscribe a EventBus al `init()`:
  - `'pX-move-left-pressed'` / `'pX-move-left-released'` (set/unset `intentLeft`)
  - `'pX-move-right-pressed'` / `'pX-move-right-released'` (set/unset `intentRight`)
  - `'pX-jump-pressed'` (intentar saltar — ver fórmula jump-buffer + coyote-time)
  - `'pX-special-pressed'` (Tier 1 — disparar special si cooldown ok)
- `update(dt)` llamado por GameLoop antes de Physics:
  1. Calcular `intentX = (intentRight ? 1 : 0) - (intentLeft ? 1 : 0)` ∈ {-1, 0, 1}.
  2. **Aceleración horizontal:** `vx += intentX × tuning.player.acceleration × dt`. Cap a `±tuning.player.maxRunSpeed`.
  3. Si `intentX === 0` y grounded: aplicar fricción adicional (decel rápida): `vx *= tuning.player.groundFriction^dt`.
  4. **Jump buffer:** si `jumpBufferedAt` reciente (dentro de `tuning.player.jumpBufferMs`) Y (grounded OR coyote-time activo): ejecutar salto, limpiar buffer.
  5. Actualizar `facing` según último intent (no según vx — más predecible).
- Detección de grounded: tras Collision step, suscribir a `'player-landed'` y a "no contacto con floor por N frames" → `isGrounded = false; lastGroundedAt = now`. Implementación: en `onCollisionWithFloor`, set `isGrounded = true`. Cada frame, si no se detectó floor contact ese frame → `isGrounded = false`.
- **Salto:** setea `vy = -tuning.player.jumpVelocity` y `isGrounded = false`. Emit `'pX-jumped'` (para SFX/particles).
- **Coyote-time:** después de dejar el suelo, durante `tuning.player.coyoteMs` (default 100ms), salto sigue válido como si estuvieras grounded. Mejora dramáticamente el feel.
- **Jump buffer:** si presionas jump justo antes de aterrizar, buffereado durante `tuning.player.jumpBufferMs` (default 120ms). Al tocar suelo, ejecuta inmediatamente.
- **Variable jump height:** si soltas jump antes del apex, `vy *= tuning.player.jumpCutFactor` (default 0.5). Permite saltos cortos vs largos. Nota: requiere también suscribir a `'pX-jump-released'`.
- **NO double-jump en MVP/Tier 1.** Considerar para vertical-slice si playtest lo pide.
- **Players NO colisionan entre sí** (layer mask, ver Collision GDD).
- **Special (Tier 1):** si `specialCooldownEndsAt < now`, disparar el special asignado (`fire-impulse`, `mega-jump`, etc. — catálogo en Special GDD), setear cooldown = `now + tuning.player.specialCooldownMs`. Emit `'pX-special-fired'` con `{ specialName }`.

## 4. Formulas

**Movimiento horizontal (sub-step de Physics):**
```
intentX ∈ {-1, 0, 1}
desiredVx = intentX × maxRunSpeed
deltaV = desiredVx - vx
appliedDeltaV = clamp(deltaV, -accel × dt, +accel × dt)
vx += appliedDeltaV
```

**Salto:**
```
canJump = jumpBufferActive AND (isGrounded OR (now - lastGroundedAt < coyoteMs))
if canJump:
  vy = -jumpVelocity     # negativo = arriba
  isGrounded = false
  jumpBufferedAt = 0     # consumido
```

**Variable jump height (jump-cut):**
```
on jump-released:
  if vy < 0:                # todavía subiendo
    vy *= jumpCutFactor     # corta el momentum
```

**Variables y rangos:**
- `acceleration`: 4000 px/s². Rango [2000, 8000]. Bajo = sliding floaty; alto = snappy.
- `maxRunSpeed`: 600 px/s. Rango [400, 1000].
- `jumpVelocity`: 850 px/s. Rango [600, 1200]. Combinada con gravity 1800 → altura máx ≈ 200px (= 850²/(2×1800)), tiempo en aire ≈ 0.94s.
- `coyoteMs`: 100. Rango [0, 200]. >200 = "salté en el aire" raro.
- `jumpBufferMs`: 120. Rango [0, 300].
- `jumpCutFactor`: 0.5. Rango [0.2, 1.0]. 1.0 = sin variable jump height.
- `groundFriction`: 0.05 per second. Rango [0.001, 0.5]. Bajo = resbaloso (hielo), alto = freno seco.

**Ejemplo numérico:**
- P1 stationary, presiona Right por 0.2s con accel=4000, max=600:
  - vx tras 0.2s: `min(0 + 4000 × 0.2, 600) = min(800, 600) = 600 px/s` (cap alcanzado a 0.15s).
  - Distancia: ½ × 4000 × 0.15² + 600 × 0.05 = 45 + 30 = 75 px.

## 5. Edge Cases

- **Player oprime jump 1ms antes de aterrizar:** jump-buffer captura, ejecuta al tocar suelo. Funciona.
- **Player oprime jump 1ms después de salir del suelo:** coyote-time captura. Funciona.
- **Player oprime jump dos veces consecutivas en aire:** segunda ignorada (buffered, pero `canJump = false` durante todo el aire). Si toca suelo dentro del buffer → ejecuta una sola vez.
- **Mantener jump pressed:** primer salto ejecuta. `'jump-pressed'` no se re-emite por InputBus (suppress repeat). Player debe soltar y volver a presionar para saltar de nuevo.
- **Player presionado izq+der simultáneo:** `intentX = 0` (se cancelan). `vx` decae con groundFriction. Comportamiento esperado.
- **Player cae fuera del campo (por bug, gravedad explota):** detectar Y > campo+1000 → respawn al spawn point + log warning.
- **`update(dt)` con dt anormal (>50ms):** PROTECCIÓN — clamp `dt = min(dt, 0.05)` antes de aplicar fórmulas. Evita teleport.
- **Cambio de tuning de `maxRunSpeed` mientras player corre a vieja vMax:** próximo step lo cap. Si es bajado, vx se mantiene unos frames y baja con fricción.
- **Special pressed durante cooldown:** ignorado silenciosamente. Opcional UI: pulsar la barra de cooldown rojo brevemente.
- **Player muere/respawn:** `respawn()` resetea `vx=vy=0, x=spawnX, y=spawnY, intentX=0, isGrounded=false`. Limpia jumpBuffer.

## 6. Dependencies

- **Depende de:** Physics (registra entity), Collision (registra entity, recibe eventos), InputBus (suscribe a `pX-*-pressed`/`released`), EventBus, Tuning.
- **Es dependido por:** Special (lee state del player para aplicar effect), AIController (sustituye InputBus subscription), Renderer (lee posición para dibujar), HUD (lee score/cooldown), JuiceController (suscribe a `'pX-jumped'`, `'pX-special-fired'`), AudioPlayer (idem).
- **Bidireccional con:** InputBus GDD menciona suscriptores; Collision GDD menciona HEAD layer.

## 7. Tuning Knobs

| Knob | Default | Rango seguro | Afecta |
|---|---|---|---|
| `player.acceleration` | 4000 px/s² | [2000, 8000] | Snap del movimiento. |
| `player.maxRunSpeed` | 600 px/s | [400, 1000] | Velocidad horizontal máx. |
| `player.jumpVelocity` | 850 px/s | [600, 1200] | Altura/duración de salto. |
| `player.coyoteMs` | 100 | [0, 200] | Forgiveness al salir del borde. |
| `player.jumpBufferMs` | 120 | [0, 300] | Forgiveness al presionar antes de aterrizar. |
| `player.jumpCutFactor` | 0.5 | [0.2, 1.0] | Variable jump height (corte al soltar). |
| `player.groundFriction` | 0.05 | [0.001, 0.5] | Decel cuando no hay intent + grounded. |
| `player.specialCooldownMs` | 5000 | [2000, 10000] | Cooldown del special. (Tier 1) |
| `player.headRadius` | 32 px | [24, 48] | Tamaño visual y de colisión. |
| `player.mass` | 1.0 | [0.5, 2.0] | Para fórmulas de impulse en cabezazo. |

## 8. Acceptance Criteria

- ✅ Presionar Right durante 0.2s → P1 acelera hasta `tuning.player.maxRunSpeed` (600 default), se desplaza ~75px.
- ✅ Soltar Right → P1 desacelera con `groundFriction`, se detiene en <0.3s.
- ✅ Presionar Jump grounded → P1 sube con `vy = -850`, alcanza pico ~200px arriba en ~0.47s, cae ~0.47s más.
- ✅ Soltar Jump al subir (a vy=-500) → vy se corta a -250 (jump-cut), pico más bajo.
- ✅ Coyote-time: caminar fuera de plataforma, 80ms después presionar Jump → salta normal. Probarlo a 150ms → NO salta (coyote expiró).
- ✅ Jump buffer: presionar Jump 90ms antes de aterrizar → al tocar suelo, salta inmediato. A 200ms antes → buffer expiró, NO salta.
- ✅ HEAD vs HEAD: dos players atravesándose no colisionan.
- ✅ Player cabezazo balón → `'ball-hit-head'` emitido + balón cambia velocidad per Collision rules + `lastToucher` del balón actualiza al playerId del cabezazo.
- ✅ P1 caer fuera del campo (Y > 2000) → `respawn()` automático al spawnPoint.
- ✅ Cambiar `tuning.player.jumpVelocity` en runtime → siguiente salto usa valor nuevo.
- ✅ P2 con bindings P2 (Arrows + `,`) controla SOLO al P2, no al P1. Independencia total.
- ✅ Player special pressed con cooldown activo → ignorado, sin emitir `'pX-special-fired'`.
