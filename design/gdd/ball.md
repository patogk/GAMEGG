# GDD — Ball

*Created: 2026-05-11*
*Layer: Feature · Priority: MVP (Tier 0) · Critical*

## 1. Overview

Ball es la entidad central del juego: un círculo con física pesada (per art-bible "disco de hockey"), sin input directo, registrado en Physics + Collision con layer=BALL. Mantiene state mínimo: posición, velocidad, `lastToucher` (para el color del glow per art-bible) y un `spinFake` numérico (para rotación visual del decorativo interno — no afecta físicas). Reset al centro tras cada gol.

## 2. Player Fantasy

Sirve **GOLAZO O NADA** (P1) y **PESO Y JUICE** (P4): el balón debe sentirse como **un objeto serio con masa real** — no un globo, no una pelota de plástico. Cuando lo cabeceás bien, sale disparado con peso. Cuando cae al suelo, el "thud" debe sonar/sentirse real. El glow del balón cambia al color del último que lo tocó — cuenta la historia visualmente sin UI.

## 3. Detailed Rules

- Constructor: `new Ball({ x, y })`. Default spawn: centro del campo, `vy = 0, vx = 0`.
- Estado: `{ x, y, vx, vy, lastToucher: null | 'p1' | 'p2', spinFake: 0 }`.
- Conecta entity a Physics (`registerCircle`) y Collision (`registerCircle` con layer=BALL, layersMask=HEAD|FLOOR|WALL|POST|GOAL).
- Suscribe a EventBus al `init()`:
  - `'ball-hit-head'` (`{ playerId, hitVelocity }`) → setear `lastToucher = playerId`. Emit `'ball-toucher-changed'` `{ playerId }` para Renderer (cambia color del glow).
  - `'goal-scored'` → llamar `reset()` tras lock de 1.5s (timer interno; opcionalmente MatchState lo orquesta).
- `update(dt)` llamado por GameLoop:
  - Actualizar `spinFake += vx × tuning.ball.spinScale × dt` (visual fake; el Renderer rota el decorativo del balón con este número).
  - Defensive: si `|vx| > tuning.physics.maxVelocity` o `|vy| > tuning.physics.maxVelocity`, clamp + log warning.
- `reset()`:
  - Posición al centro (x = fieldCenterX, y = fieldCenterY).
  - `vx = vy = 0`.
  - `lastToucher = null` (glow vuelve a blanco neutro).
  - `spinFake = 0`.
  - Emit `'ball-reset'` para Renderer (poof de partículas opcional).
- **Sin input directo** — todo movimiento viene de cabezazos (Collision) y de la integración Physics.
- **Sin spin físico** — `spinFake` es puramente cosmético. NO afecta colisiones (no hay Magnus effect, etc.). Decisión de scope.
- **`lastToucher` es semántico, no físico** — define quién metió el gol cuando el balón cruza la línea (Collision lo lee al disparar `'goal-scored'` para construir el payload). Si `lastToucher === null` (saque inicial sin toques) y entra a una portería, gol se asigna al **otro** equipo (own-goal por física inicial; raro, posible en MVP).

## 4. Formulas

**spinFake (visual rotation del decorativo interior):**
```
spinFake_new = spinFake_old + vx × spinScale × dt
spinFake = spinFake mod (2π)   # mantener en [0, 2π) para evitar overflow long-running
```

Donde `spinScale = 0.05 rad/(px/s)` por default. Significa: balón a vx=600 px/s rota a 30 rad/s = ~4.8 rev/s. Decorativo dentro del balón es una línea que indica orientación.

**Reset position:**
```
x = tuning.field.centerX
y = tuning.field.centerY - tuning.ball.spawnHeightOffset    # spawnea un poco arriba para caer al saque
vx = 0; vy = 0
```

**Variables:**
- `spinScale`: rad/(px/s), 0.05 default.
- `mass`: 0.3 (defined in Collision GDD/tuning).
- `radius`: 18 px default.
- `spawnHeightOffset`: 100 px (cae al centro al saque).

## 5. Edge Cases

- **Balón sale del campo por arriba (jumps + cabezazo lo lanzan al techo invisible):** rebota normal en techo (AABB del techo a Y=−200). Esperado.
- **Balón se atasca dentro de un poste (overlap inicial):** Collision positional correction lo expulsa en pocos sub-steps. Si overlap > radius, log warning + teleport a centro.
- **Balón muere/desaparece:** no implementado — el balón siempre existe (no hay pickups ni multi-balón en MVP). Modifier `multi-ball-illusion` (post-vertical-slice) crea balones extra registrados como Ball separados.
- **`'ball-hit-head'` recibido durante reset (lock):** ignorado — Collision NO emite eventos durante el lock de gol.
- **`lastToucher` nunca se ha setteado y entra a portería de P2:** gol se asigna a P1 (own goal). Documentar en MatchState GDD.
- **Modifier `no-ball-gravity` activo:** hookea `onPreIntegrate` para forzar `entity.gravityScale = 0`. Ball no sabe del modifier — funciona vía Physics plugin layer.
- **Modifier `giant-ball`:** modifica `tuning.ball.radius` antes de match start (no en runtime — cambiar radio mid-match rompe collision). Ball lee `tuning.ball.radius` al `init()` del match.
- **`reset()` durante slow-mo:** posición se reset instantáneo (no afectado por timeScale). Esperado.

## 6. Dependencies

- **Depende de:** Physics, Collision, EventBus, Tuning.
- **Es dependido por:** Renderer (lee posición + lastToucher para glow color), Collision (registrado), Special (algunos specials lo afectan: `fire-impulse` aplica vy directo al balón si está cerca), JuiceController (suscribe a eventos derivados), AudioPlayer (idem), AIController (lee posición + velocidad para anticipar).
- **Bidireccional con:** Collision GDD menciona BALL layer; Renderer GDD menciona el `lastToucher` color binding.

## 7. Tuning Knobs

| Knob | Default | Rango seguro | Afecta |
|---|---|---|---|
| `ball.radius` | 18 px | [12, 48] | Tamaño visual y de colisión. Modifier `giant-ball` lo lleva a 36. |
| `ball.mass` | 0.3 | [0.1, 1.0] | Cuánto vuela tras cabezazo vs cuánto retrocede la cabeza. Bajo = vuela mucho. |
| `ball.spinScale` | 0.05 rad/(px/s) | [0, 0.2] | Velocidad visual del giro fake. 0 = sin spin visual. |
| `ball.spawnHeightOffset` | 100 px | [0, 300] | Altura sobre el centro al saque. Alto = saque dramático con caída. |
| `ball.gravityScale` | 1.0 | [0, 5] | Per-entity. Modifier `no-ball-gravity` setea a 0. |

(Restitución vs. cada superficie está en `tuning.collision.*` — ver Collision GDD.)

## 8. Acceptance Criteria

- ✅ Spawn en centro con `vy=0` → cae con gravedad estándar, llega al suelo en ~0.47s desde 100px arriba (verificar con 1/2 g t² = 100 → t ≈ 0.33s, hmm — ajustar spawnHeightOffset si quiero más drama).
- ✅ Cabezazo recibido → `lastToucher` actualiza inmediato + evento `'ball-toucher-changed'` emitido + Renderer cambia color del glow del balón.
- ✅ `reset()` llamado → posición al centro, velocidades cero, `lastToucher = null`, glow vuelve a blanco.
- ✅ `lastToucher === null` y balón entra a portería P2 → `'goal-scored'` con `playerId = 'p1'` (own-goal por defecto al P1).
- ✅ Modifier `giant-ball` aplicado pre-match → `ball.radius === 36` durante toda la partida; reset() respeta el modifier.
- ✅ Modifier `no-ball-gravity` aplicado → balón flota tras saque (no cae); cabezazo lo hace flotar en línea recta.
- ✅ Spin visual: balón con vx=600 → spinFake incrementa ~30 rad/s; visible en Renderer (línea decorativa rota).
- ✅ Balón con velocidad clamp por Physics → Ball NO emite warnings adicionales (deja que Physics maneje).
- ✅ Cambiar `tuning.ball.mass` en runtime → próxima colisión usa el valor nuevo.
- ✅ Cambiar `tuning.ball.radius` mid-match → log warning ("radius cambiado mid-match, no aplicado hasta próximo reset/match"), sigue usando radio anterior hasta `init()`.
