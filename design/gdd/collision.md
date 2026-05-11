# GDD — Collision

*Created: 2026-05-11*
*Layer: Core · Priority: MVP (Tier 0) · Critical*

## 1. Overview

Collision detecta y resuelve choques entre entidades del juego (cabezas, balón) y la geometría estática (suelo, paredes, postes), además de detectar el cruce de la línea de gol. Opera **después** de que Physics integró las posiciones, dentro del mismo sub-step. Soporta dos primitivas: **círculo-círculo** (cabeza-balón, balón-balón) y **círculo-AABB** (entidad-pared/suelo/poste). Emite eventos al EventBus para que JuiceController y otros sistemas reaccionen.

## 2. Player Fantasy

Sirve **GOLAZO O NADA** (P1): la detección de gol debe ser **instantánea, inequívoca y celebrable** — el balón cruza la línea, se dispara el evento, todo el mundo sabe que fue gol. Sirve también **PESO Y JUICE** (P4): el rebote debe sentirse correcto. Coeficientes de restitución bien ajustados son la diferencia entre "satisfactorio" y "raro".

## 3. Detailed Rules

- API: `registerCircle(entity)`, `registerAABB(entity)`, `registerGoal(goal)`, `unregister...()`, `step()`.
- Cada entidad colisionable tiene `{x, y, vx, vy, radius?, width?, height?, mass, restitution, layer, layersMask}`.
  - `layer`: bit-flag identificando categoría (HEAD=1, BALL=2, WALL=4, FLOOR=8, POST=16, GOAL=32).
  - `layersMask`: bit-flag de qué layers colisiona. Por ejemplo HEAD colisiona con WALL+FLOOR+POST+BALL pero **NO** con HEAD (los jugadores no chocan entre sí — pillar P3: el juego es contra el balón, no luchar contra el otro).
- `step()` es llamado por GameLoop tras `physics.step()`, en cada sub-step. Procesa:
  1. **Broad phase** (skip): MVP no necesita — pocas entidades. Cada par chequeado con AABB rápido.
  2. **Narrow phase circle-circle:** ver fórmulas. Si solapan: emitir evento `'collision-detected'` + resolver con impulse.
  3. **Narrow phase circle-AABB:** clamp del centro del círculo al AABB, calcular distancia. Si < radius: solapan.
  4. **Goal-line check:** para cada `goal`, chequear si el centro del balón cruzó la `goalLineX` y está dentro del rango Y de la portería. Emitir `'goal-scored'` con `{ playerId, ballEntity }`. **Una vez emitido**, locking 1.5s para evitar doble-trigger durante reset.
- **Resolución de colisión circle-circle:**
  - Calcular vector normal `n = (B - A).normalized`.
  - Calcular velocidad relativa `vRel = (B.v - A.v) · n`.
  - Si `vRel >= 0` (separándose), **NO** aplicar impulse.
  - Calcular impulse `j = -(1 + e) × vRel / (1/A.mass + 1/B.mass)` con `e = min(A.restitution, B.restitution)`.
  - Aplicar `A.v -= (j/A.mass) × n; B.v += (j/B.mass) × n`.
  - **Resolver penetración** (positional correction): mover ambos por `(overlap × correctionFactor) × n` proporcional a sus masas inversas. `correctionFactor = 0.8` (no 1.0 — evita jitter).
  - Hook `onCollisionResolve(manifold)` de modifiers (per Physics plugin contract): llamado ANTES de aplicar impulse, puede multiplicar/anular `j`.
- **Resolución circle-AABB:**
  - Tratar AABB como masa infinita (no se mueve, no recibe impulse).
  - Calcular normal según cara de contacto.
  - Reflejar velocidad: `v_out = v_in - (1 + e) × (v_in · n) × n`.
  - Resolver penetración moviendo solo al círculo.
- **Eventos emitidos:**
  - `'ball-hit-head'` `{ playerId, hitVelocity }` — al detectar circle-circle entre HEAD y BALL.
  - `'ball-hit-floor'` / `'ball-hit-wall'` / `'ball-hit-post'` `{ velocity }` — para JuiceController/SFX.
  - `'goal-scored'` `{ playerId }` — cuando balón cruza línea de gol.
  - `'player-landed'` `{ playerId, vy }` — al primer contacto con suelo tras estar en aire (squash visual).

## 4. Formulas

**Circle-circle overlap:**
```
dx = B.x - A.x
dy = B.y - A.y
distSq = dx² + dy²
sumR  = A.radius + B.radius
overlapping = distSq < sumR²
dist = √distSq
overlap = sumR - dist
n = (dx/dist, dy/dist)   # unit normal A→B
```

**Impulse (perfectly elastic con restitution):**
```
e = min(A.restitution, B.restitution)
vRel = (B.vx - A.vx) × n.x + (B.vy - A.vy) × n.y
if vRel >= 0: skip   # separating
j = -(1 + e) × vRel / (1/A.mass + 1/B.mass)
A.vx -= (j/A.mass) × n.x;  A.vy -= (j/A.mass) × n.y
B.vx += (j/B.mass) × n.x;  B.vy += (j/B.mass) × n.y
```

**Positional correction (anti-jitter):**
```
percent = 0.8     # tuning.collision.correctionPercent
slop    = 0.5 px  # tuning.collision.penetrationSlop
correction = max(overlap - slop, 0) × percent / (1/A.mass + 1/B.mass)
A.x -= (correction × n.x) / A.mass
B.x += (correction × n.x) / B.mass
(idem y)
```

**Circle vs AABB clamped distance:**
```
closestX = clamp(circle.x, aabb.x, aabb.x + aabb.width)
closestY = clamp(circle.y, aabb.y, aabb.y + aabb.height)
dx = circle.x - closestX
dy = circle.y - closestY
distSq = dx² + dy²
overlapping = distSq < radius²
```

**Variables / rangos:**
- `e` (restitución): [0, 1]. Cabeza-balón: `tuning.collision.restitutionHeadBall = 0.85`. Balón-suelo: `0.6`. Balón-pared: `0.7`. Balón-poste: `0.95` (rebote crispy).
- `mass`: cabeza = `1.0`, balón = `0.3`, AABB infinita.
- `radius`: cabeza `tuning.head.radius = 32`, balón `tuning.ball.radius = 18`.

**Ejemplo numérico:**
- Cabeza estática (vx=0) golpea balón (que cae a vy=600). Tras colisión vertical (n=(0,−1)):
  - vRel = (0 − 600) × (−1) = 600
  - j = −(1+0.85) × 600 / (1/1 + 1/0.3) ≈ −255
  - vy_balón = 600 + (−255 / 0.3) × (−1) = 600 + 850 = 1450 (sale 2.4× la velocidad de impacto, "thud" satisfactorio)

## 5. Edge Cases

- **Tunneling (entidad muy rápida cruza un muro en un sub-step sin detectar):** mitigación primaria es `tuning.physics.maxVelocity = 3000 px/s` cap + sub-step de 1/120s. A esa velocidad max, balón se mueve 25 px por sub-step; muros tienen ≥40px de grosor → no tunelea. **Fallback:** post-vertical-slice considerar swept collision para balón si surge bug en playtest.
- **Múltiples colisiones simultáneas en mismo sub-step (balón en esquina toca pared+suelo):** procesarlas secuencialmente. Orden: AABB primero (estática), luego circle-circle. Resolución es estable porque cada paso reduce overlap.
- **Gol durante slow-mo:** `'goal-scored'` se emite igual; lock de 1.5s mide en tiempo de juego (afectado por timeScale), NO en wall-clock — así durante slow-mo el lock se "extiende" en wall-clock, OK.
- **Balón sale del campo por arriba (jump alto, no hay techo):** AABB del techo a Y negativa garantiza rebote. Si no hay techo, balón cae eventualmente. MVP define techo invisible a Y = -200 del top.
- **Cabeza atascada dentro de pared (spawn dentro):** primer step resuelve con positional correction, expulsa. Si overlap inicial > radio: log warning, teleport a posición segura (centro del campo, Y=200).
- **`'goal-scored'` durante el lock de 1.5s:** ignorado silenciosamente. Esperado durante reset.
- **Balón sin masa o NaN:** ignorar entity en collision pass + log warning.
- **Mismo par procesado 2 veces (A vs B y B vs A):** evitar con set de pares ya procesados ese sub-step. O iterar siempre con i < j.
- **Restitución > 1:** permitido en código (modifiers como "bouncy walls" suben a 1.2). El balón gana energía en cada rebote — comportamiento intencional.

## 6. Dependencies

- **Depende de:** Physics (consume posiciones/velocidades post-integrate), Tuning, EventBus.
- **Es dependido por:** PlayerCharacter (registra cabeza), Ball (registra balón), MatchState (consume `'goal-scored'`), JuiceController (consume `'ball-hit-head'`, `'goal-scored'`), AudioPlayer (mismos eventos para SFX), ModifierSystem (modifier.onCollisionResolve hook).
- **Bidireccional con:** Physics GDD menciona Collision como consumer; ModifierSystem GDD menciona el `onCollisionResolve` hook.

## 7. Tuning Knobs

| Knob | Default | Rango seguro | Afecta |
|---|---|---|---|
| `collision.restitutionHeadBall` | 0.85 | [0.5, 1.2] | Energía conservada en cabezazo. Alta = balón "vuela" tras toque (golazo); baja = pase corto. |
| `collision.restitutionBallFloor` | 0.6 | [0.3, 0.95] | Rebote del balón al caer. Bajo = muere rápido; alto = rebota eternamente. |
| `collision.restitutionBallWall` | 0.7 | [0.4, 1.0] | Rebote contra paredes laterales. Define dinámica de pared. |
| `collision.restitutionBallPost` | 0.95 | [0.7, 1.2] | Rebote contra postes. **Alto a propósito** — el "PALO!" debe sentirse picante. |
| `collision.correctionPercent` | 0.8 | [0.5, 1.0] | % de overlap corregido por sub-step. <0.5 entidades quedan sumergidas; 1.0 jitter. |
| `collision.penetrationSlop` | 0.5 px | [0, 2] | Tolerancia antes de corregir. Previene jitter cuando entidades reposan. |
| `collision.goalLockMs` | 1500 | [500, 3000] | Tiempo tras `'goal-scored'` durante el cual no se emite otro gol (durante reset). |
| `collision.headBallMassRatio` | 1 / 0.3 | — | Ratio masa cabeza/balón. Define cuánto "vuela" el balón vs cuánto retrocede la cabeza. |

## 8. Acceptance Criteria

- ✅ Cabeza estática + balón cayendo a vy=600 → tras colisión, balón sale a vy ≈ −1450 px/s (per fórmula con defaults).
- ✅ Balón cae libre y golpea suelo a vy=600 → rebota a vy ≈ −360 (= −600 × 0.6, sin masa porque suelo es infinita).
- ✅ Balón cruza `goalLineX` de portería de P2 → exactamente 1 evento `'goal-scored'` con `{ playerId: 'p1' }` (P1 metió en portería de P2).
- ✅ Tras `'goal-scored'`, durante los siguientes 1.5s NO se emiten otros eventos `'goal-scored'` (lock funcionando).
- ✅ HEAD vs HEAD: cero colisión. Layers mask correctamente excluye.
- ✅ Modifier que retorna `j × 1.5` en `onCollisionResolve` → impulses 1.5× normales (rebotes más fuertes). Verificable midiendo vy post-rebote.
- ✅ Cabeza spawneada con overlap dentro de pared → en 5 sub-steps, posición corregida fuera del muro (no atascada).
- ✅ Balón viajando a vMax (3000 px/s) hacia muro de 40px de grosor → choca, no atraviesa (no tunneling).
- ✅ Cambiar `tuning.collision.restitutionHeadBall` en runtime → siguiente cabezazo usa el valor nuevo.
- ✅ Con 5 entidades + 6 walls/posts, `step()` ejecuta en <1.5ms.
- ✅ Squashed: balón en esquina (toca pared+suelo simultaneamente) se resuelve en ≤3 sub-steps sin oscilar.
