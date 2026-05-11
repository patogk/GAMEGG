# GDD — Renderer (Canvas2D)

*Created: 2026-05-11*
*Layer: Presentation · Priority: MVP (Tier 0) · Critical*

## 1. Overview

Renderer es el dibujante: cada frame consume una **lista de Drawables** (contrato impuesto por TD-SYSTEM-BOUNDARY concern #2) y produce un frame de Canvas 2D. NO conoce los tipos concretos (Ball, PlayerCharacter, HUD, ParticleSystem) — solo el contrato `Drawable { draw(ctx, t, alpha) }`. Esto resuelve el riesgo God Object y permite que HUD, particles y entidades se dibujen con el mismo pipeline.

Implementa las técnicas del art-bible "Neón de Medianoche": fondo negro absoluto, glow vía `globalCompositeOperation = 'lighter'` + radial gradients pre-renderizados, chromatic aberration durante slow-mo, full-screen flash en gol, screen shake.

## 2. Player Fantasy

Sirve directamente **PESO Y JUICE SOBRE TODO** (P4) y **GOLAZO O NADA** (P1): el Renderer ES el feedback visual que materializa los pillars. Cada glow, cada flash, cada shake es lo que hace que el jugador "sienta" el peso. También sirve **EL PIQUE** (P3) garantizando lectura instantánea (silueta sobre detalle) en split-attention de 2 jugadores.

## 3. Detailed Rules

- API: `init(canvas, tuning)`, `register(drawable)`, `unregister(drawable)`, `render(alpha, frameTimeMs)`.
- **`Drawable` contract** (cualquier objeto que implementa esto puede ser dibujado):
  ```
  Drawable {
    zOrder: number    // higher = drawn later (on top)
    visible: boolean
    draw(ctx, t, alpha)   // ctx = CanvasRenderingContext2D, t = absolute time ms, alpha = interp
  }
  ```
- `register(drawable)` añade a la lista; `unregister` remueve. Lista se sortea por `zOrder` cada vez que `register/unregister` corre (no cada frame — `register` es raro).
- **zOrder convencional:**
  - 0–9: fondo (campo, líneas)
  - 10–19: world entities (players, ball)
  - 20–29: particles (ball trail, hit sparks)
  - 30–39: VFX overlay (special aura, slow-mo aberration)
  - 40–49: HUD
  - 50: full-screen overlays (goal flash, slow-mo vignette)
- **Pipeline de `render(alpha, frameTimeMs)`:**
  1. Si screen-shake activo: aplicar `ctx.translate(shakeX, shakeY)` con valores tomados de `tuning.juice.shake.*` (Tier 1 — en Tier 0 sin shake).
  2. **Clear:** `ctx.fillStyle = tuning.colors.bgBlack; ctx.fillRect(0, 0, w, h)` (no `clearRect` — queremos negro sólido, no transparente).
  3. **Pre-pass:** si slow-mo activo (timeScale < 0.95), preparar layer composite (3 offsets para chromatic aberration, ver fórmulas).
  4. **Drawables pass:** iterar lista sorted por zOrder, llamar `drawable.draw(ctx, frameTimeMs, alpha)` para cada visible.
     - Antes de cada draw: `ctx.save()`. Después: `ctx.restore()`. Aísla mutations por drawable.
  5. **Post-pass:** si chromatic aberration activo: re-componer canvas con offsets cyan/magenta.
  6. **Goal flash:** si flash activo (set por evento `'goal-scored'`), llenar full-screen con verde lima alfa decreciente.
  7. Si shake activo: `ctx.translate(-shakeX, -shakeY)` (restore).
- **Glow technique** (per art-bible — no `shadowBlur`):
  - Pre-renderizar al `init()` un set de **radial gradient sprites** (offscreen canvases): uno por color principal × tamaño (cyan 64px, magenta 64px, white 32px, lime 96px, etc.).
  - En `draw()` de cada entity con glow: `ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite, x - r, y - r); ctx.globalCompositeOperation = 'source-over'`.
  - Esto es 10-100x más rápido que `shadowBlur` por draw.
- **Cache de gradientes:** invalidar si la paleta cambia (post-vertical-slice cuando entren stadiums con palette swap). MVP: cache permanente.
- **Interpolation alpha:** GameLoop pasa `alpha = accumulator / FIXED_DT_MS` ∈ [0, 1) — Renderer interpola entre la posición actual de la entidad y su posición previa para suavizar a 60fps cuando la simulación corre a 120Hz. Cada Drawable decide si interpola (entidades físicas sí, HUD no).
- **Resize:** suscribir a `window.resize`, reajustar canvas internal size + ratio de DPR (`devicePixelRatio`). Mantener aspect ratio del campo (16:9 default).
- **Sin animaciones de sprite frame-by-frame en MVP** — todo dibujado primitivo. Animación = squash/stretch + interpolación + cambio de boca via `Path2D` switch.

## 4. Formulas

**Chromatic aberration durante slow-mo:**
```
intensity = 1 - timeScale       # 0 cuando normal, 0.85 cuando slow-mo a 0.15
offsetPx  = lerp(0, 4, intensity)
```
Implementación: dibujar el frame normal, luego dibujar capa cyan offset (-offsetPx, 0) con composite=`lighter`, luego capa magenta offset (+offsetPx, 0). MVP simplificación: solo durante goal slow-mo (no en specials).

**Goal flash:**
```
flashIntensity(t_since_goal) = max(0, 1 - t_since_goal / flashDurationMs)   # decrece linear
flashAlpha = flashIntensity × maxFlashAlpha     # cap a 0.6 para no cegar
ctx.fillStyle = `rgba(166, 255, 0, ${flashAlpha})`
ctx.fillRect(0, 0, w, h)
```
- `flashDurationMs` default `400`.
- `maxFlashAlpha` default `0.6`.

**Glow sprite generation (al init):**
```
size = 2 × radius
canvas = offscreen size×size
g = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius)
g.addColorStop(0, `${color}FF`)
g.addColorStop(0.4, `${color}80`)
g.addColorStop(1, `${color}00`)
ctx.fillStyle = g
ctx.fillRect(0, 0, size, size)
```
Cache: `glowSprites['cyan-32'] = canvas` etc.

**Interpolación posicional:**
```
renderX = entity.prevX + (entity.x - entity.prevX) × alpha
renderY = entity.prevY + (entity.y - entity.prevY) × alpha
```
Cada Drawable que interpola guarda `prevX/prevY` antes de cada Physics step.

**Variables:**
- `alpha`: ∈ [0, 1) provisto por GameLoop.
- `frameTimeMs`: `performance.now()`, para animaciones tiempo-absoluto (e.g., pulse del cooldown).

## 5. Edge Cases

- **Drawable lanza excepción en `draw`:** wrap en try/catch, log error con drawable name (si tiene `.name`), continúa con próximo drawable. Un drawable bug NO debe romper el frame.
- **`drawable.visible === false`:** skip en el pass.
- **`drawable.zOrder` cambiado mid-frame:** próximo frame respeta el nuevo orden (re-sort en register/unregister, no por frame; cambios mid-frame ignorados hasta próxima registración).
- **Canvas con tamaño 0 (window minimizada):** skip render, return early. Evita errores en gradientes con radius 0.
- **DPR alto (Retina):** canvas internal size = CSS size × DPR, `ctx.scale(DPR, DPR)`. Garantiza crisp en pantallas hi-dpi.
- **Browser sin soporte `globalCompositeOperation = 'lighter'`:** ningún navegador moderno (last 2 versions) carece. Fallback: usar `'source-over'` y aceptar que los glows no son aditivos. Log warning. (No esperado en producción.)
- **Goal flash mientras hay otro goal flash activo:** segundo flash reinicia el contador (no se acumulan).
- **Alpha de interpolación = 1.0** (raro, pero teórico): `renderX = entity.x` (posición actual). Visualmente correcto.
- **Drawable con `zOrder === undefined`:** tratar como 0. NO crashear.
- **`render()` llamado con frameTime in passing > 100ms desde último render:** dibujar igual; no hay catch-up especial. Es responsabilidad de GameLoop manejar la cadencia.

## 6. Dependencies

- **Depende de:** RenderContext (provee `<canvas>` + ctx + viewport), Tuning (paleta, tamaños).
- **Es dependido por:** GameLoop (llama `render()` por frame), todas las entidades que se quieren dibujar (deben implementar Drawable y llamar `register`).
- **Drawables conocidos:** PlayerCharacter, Ball, ParticleSystem (Tier 1), HUD, GoalFlashOverlay (singleton overlay del Renderer mismo o sistema separado), MainMenu, CharacterSelect, ResultScreen, KeyboardCalibration.
- **Bidireccional con:** RenderContext GDD (no listada como crítica, pero documentar el setup en su GDD); cada drawable debe declarar en su GDD que implementa el contrato.

## 7. Tuning Knobs

| Knob | Default | Rango seguro | Afecta |
|---|---|---|---|
| `render.dpr` | window.devicePixelRatio | [1, 3] | Crispness en pantallas hi-dpi. Cap a 2 en perf bajo. |
| `render.fieldAspect` | 16/9 | [4/3, 21/9] | Aspect del canvas. Resize ajusta. |
| `render.goalFlashDurationMs` | 400 | [200, 800] | Duración del flash verde tras gol. |
| `render.goalFlashMaxAlpha` | 0.6 | [0.3, 0.9] | Intensidad del flash. Alta ciega. |
| `render.chromaticAberrationMaxOffsetPx` | 4 | [1, 12] | Offset máximo de canales cyan/magenta en slow-mo. |
| `render.glowSpriteSizes` | [32, 64, 96, 128] | — | Tamaños cacheados al init. |
| `render.bgBlack` | `#000000` | — | Color de clear. NO cambiar (rompe pillar P4 art-bible). |
| `render.interpolationEnabled` | true | true/false | Toggle interpolación. False = posiciones snap (debug). |

## 8. Acceptance Criteria

- ✅ `init()` con canvas 1280×720 → ctx 2D listo, glow sprites pre-renderizados (≥4 colors × ≥3 sizes), bg cleared a negro.
- ✅ Registrar 3 drawables con zOrder [10, 5, 30] → se dibujan en orden 5, 10, 30 (lower zOrder primero, dibujado debajo).
- ✅ Drawable con `visible = false` → no se dibuja (verificable midiendo draws con stub).
- ✅ Drawable que lanza excepción → no crashea el frame; otros drawables se siguen dibujando; error logueado.
- ✅ Glow sprite cyan 64px aplicado a posición (100, 100) → píxel (100,100) con composite='lighter' añade luminancia (verificable con `ctx.getImageData`).
- ✅ Slow-mo activo (timeScale=0.15) → chromatic aberration visible: dibujo de un círculo blanco aparece con halo cyan a la izq y magenta a la der.
- ✅ Evento `'goal-scored'` recibido → flash verde lima full-screen con alpha decreciente de 0.6 a 0 en 400ms.
- ✅ Resize de window → canvas se ajusta a nuevo tamaño, mantiene aspect 16:9.
- ✅ Cambiar `tuning.render.bgBlack` en runtime → próximo frame usa el nuevo color (validación: regla "tuning.X at use site" funciona).
- ✅ Render de 30 drawables (incl. 50 partículas) ejecuta en <8ms (per perf budget).
- ✅ DPR=2 → canvas internal es 2x, escalado correcto.
- ✅ Sin drawables registrados: render solo dibuja el clear negro. No crashea.
- ✅ `alpha = 0.5`: drawable con `prevX=100, x=200` se dibuja en x=150 (interpolación lineal).
