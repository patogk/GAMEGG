# Art Bible: MEGA HEAD CUP

*Created: 2026-05-11*
*Visual Identity Anchor: NEÓN DE MEDIANOCHE (locked via AD-CONCEPT-VISUAL, 2026-05-11)*
*Status: Draft — pending AD-ART-BIBLE sign-off*

> **Production reality:** This game has **no traditional art pipeline**. Everything visible is drawn in code via Canvas 2D primitives, additive composite, particles, and pre-rendered radial gradients for glow. Sections 5–6–8 are intentionally brief because there are no characters to model, no environments to texture, and no assets to standardize beyond palette and shape rules. The visual style IS the technique.

---

## 1. Visual Identity Statement

### Visual Rule
> **El campo es negro vacío — solo existe lo que emite luz.**

Esta es la decisión que resuelve cualquier ambigüedad visual. Si una propuesta no respeta este axioma (añadir un fondo decorado, un objeto sin emisión propia, un detalle interno a un personaje silueta), es incorrecta — no por gusto, sino por contrato.

### Supporting Principles

**P1 — Silueta sobre detalle**
> Toda forma se lee primero como silueta. Cero detalle interno hasta haber resuelto la silueta.
> *Design test:* Si un personaje no se reconoce a 32×32px en blanco sobre negro, falló.

**P2 — Glow como narrativa, no como decoración**
> Cada brillo cuenta algo: estado del jugador, momentum del balón, tensión del momento. Un glow que no comunica algo es ruido.
> *Design test:* Si quitamos el glow de un elemento y nadie pierde información de juego, ese glow no debió existir.

**P3 — Saturación es el indicador de intensidad**
> En reposo: colores controlados. En slow-mo / gol / special: saturación máxima + chromatic aberration leve. La pantalla "respira" con el ritmo del juego.
> *Design test:* Si todo está siempre al 100% saturado, perdimos el contraste. Si nada lo está, perdimos el clímax.

### Anclaje a pillars
- P1 ↔ P3 (DOS BOTONES, MIL JUGADAS) — claridad instantánea para jugador casual
- P2 ↔ P4 (PESO Y JUICE) — el glow es el feedback
- P3 ↔ P1 (GOLAZO O NADA) — el clímax visual del gol está pre-cableado en la regla

---

## 2. Mood & Atmosphere (por estado de juego)

| Estado | Mood / emoción | Lighting character | Adjetivos | Energy |
|---|---|---|---|---|
| **Boot / calibración** | Calma técnica, expectativa | Neón apagado, pulsa lento, monocromo | Limpio, enfocado, listo | Bajo (60bpm) |
| **Selección personaje + modifier** | Anticipación lúdica | 2 spotlights de neón, uno por jugador, color de cada uno bien definido | Punzante, juguetón, "elige tu arma" | Medio (90bpm) |
| **Saque inicial / countdown 3-2-1** | Tensión contenida | Toda la pantalla pulsa con cada beat del countdown | Cargado, eléctrico, contenido | Medio-alto (110bpm) |
| **Juego activo (90% del tiempo)** | Foco total, intensidad sostenida | Glow constante en cabezas y balón, trails sutiles, fondo absolutamente negro | Limpio, intenso, claro, frenético | Alto (140bpm) |
| **Special activo** | "Estoy cocinando algo" | Aura del personaje crece, color del special invade su silueta | Inminente, peligroso, brutal | Pico (160bpm) |
| **Slow-mo (gol o special)** | Suspensión cinemática | Saturación al 150%, chromatic aberration 4px, vignette neón sutil | Cinematográfico, exagerado, glorioso | Pico estirado |
| **Gol confirmado** | Catarsis | Flash verde lima full-screen 2 frames → fade neón → particle explosion desde el balón | Catártico, ridículo, rotundo | Pico → release |
| **Saque post-gol** | Reset, pequeña pausa | Vuelta al juego activo, breve apagón de glow (~200ms) antes de retomar | Recompose, prepárate | Medio descendente |
| **Final de partida** | Veredicto | Ganador queda iluminado, perdedor en silueta apagada. Score gigante. | Decisivo, presumido, "te la metieron" | Alto seco |
| **Pausa / menú durante juego** | Suspensión administrativa | Time scale 0, juego sigue dibujándose pero apagado al 30% | Discreto, "no estamos ahora" | N/A |

**Lighting character común:** color temperature **cool** (azules/cianes/magentas dominan), warm reservado para acentos de impacto (amarillo, naranja, rojo de special, verde lima de gol). Contraste **siempre alto** — negro absoluto + neón puro, sin grises medios.

---

## 3. Shape Language

### Vocabulario geométrico permitido
- **Círculo** — lo viviente. Cabezas (jugadores) y balón. Único objeto perfectamente circular: el balón (jerarquía instantánea).
- **Rectángulo / cuadrado de bordes rectos** — lo estático. Suelo, paredes, postes, marcador, contadores de tiempo, divisores HUD.
- **Línea recta gruesa con outline glow** — lo informativo. Bordes de cancha, indicadores de cooldown, barras de tiempo.
- **Trapecio / triángulo** — lo direccional. Flechas de saque, indicadores de "tu turno de defender", arrows de tutorial in-world (si los hay — recordatorio: NO hay tutorial).
- **Partícula (círculo pequeño con vida limitada y glow)** — lo efímero. Hits, polvo de impacto, estela del balón, explosión de gol.

### Prohibido
- **NO curvas Bezier complejas** — no hay arte vectorial fancy. Si necesitás una curva, es un arco de círculo o no es.
- **NO formas orgánicas / blob-shapes** — todo geométrico.
- **NO outlines pintados** — los "outlines" son glow halos por composite, no líneas.

### Personajes (jugadores)
- **Silueta:** círculo (la "cabeza"). Diámetro = unidad base de medida del juego (~64px en pantalla típica).
- **Cara:** 2 puntos (ojos) + 1 línea horizontal corta (boca) — **diferenciación entre personajes via color y boca/ojos**, no via forma. Lo dicta P1 (silueta sobre detalle).
- **Cuerpo:** *no hay cuerpo*. La cabeza ES el personaje. Los "pies" son colisionadores invisibles para la patada — no se renderizan.
- **Distinción P1 vs P2:** color (cyan vs magenta default) + indicador de "es tuya" (un ring tenue debajo, mismo color que la cabeza).

### Balón
- **Forma:** círculo perfecto, blanco core con glow neón (color del último jugador que lo tocó — aporta narrativa de posesión).
- **Trail:** estela de partículas escala con velocidad. En reposo: sin estela. En velocidad alta: trail largo + chromatic aberration leve.
- **Spin:** **fingido visualmente** (sin físicas reales de spin) — un ring rotando dentro del balón, velocidad angular = velocidad lineal × constante.

### UI
- **Lenguaje de forma:** mismo vocabulario que el mundo (rectángulos + líneas con glow). UI **NO es diegética** (no flota dentro del mundo) pero **comparte gramática visual** — se siente "del mismo universo".
- **Tipografía:** ver Section 4 + 7. Sans serif geométrica (rectángulos y círculos), monospace para números (score, timer).

### Hero shapes vs supporting
- **Hero (atrae el ojo):** balón, gol, cabezas, special en ejecución
- **Supporting (recede):** cancha, postes, paredes, fondo, HUD ambient
- **Regla:** los supporting tienen ≤30% del brillo de los heroes en cualquier frame. En slow-mo este ratio se exagera a 10%.

---

## 4. Color System

### Paleta primaria

| Rol | Hex | Uso semántico |
|---|---|---|
| `--bg-black` | `#000000` | Fondo absoluto. Negro real, sin tinte. |
| `--p1-cyan` | `#00E5FF` | Jugador 1 (cabeza, ring, glow, partículas suyas) |
| `--p2-magenta` | `#FF1AA1` | Jugador 2 (cabeza, ring, glow, partículas suyas) |
| `--ball-white` | `#FFFFFF` | Core del balón. Glow del balón hereda color del último tocador. |
| `--field-line` | `#1F2A38` | Líneas de cancha y postes (apenas visibles, casi un guide) |
| `--ui-text` | `#E8F1FF` | Texto principal (score, timer, menus) — blanco-azulado, no blanco puro |
| `--ui-text-dim` | `#5A6F88` | Texto secundario, hints |

### Acentos semánticos (reservados — NO usar por capricho)

| Color | Hex | Significado |
|---|---|---|
| **Amarillo neón** | `#FFE500` | Momento de impacto fuerte (golpe a balón, parry). Aparece en partícula de hit. |
| **Naranja-rojo** | `#FF4D2E` | Special cargado, peligro. Aura del personaje cuando special está listo. |
| **Verde lima** | `#A6FF00` | Gol confirmado. Flash full-screen + ring de explosión. **Solo aparece en gol.** |
| **Violeta saturado** | `#9D2BFF` | Modificador activo. Indicador del modifier en pantalla siempre tiene este tinte. |

### Reglas de uso
- **Nunca dos heroes del mismo color en pantalla simultáneamente** (excepto P1/P2 — cyan y magenta son por contrato).
- **Acentos semánticos son flashes, no estados constantes** — verde lima nunca está pintado en la cancha en reposo, solo aparece en el momento del gol.
- **Brillo y saturación escalan con momentum del juego** (ver Section 2 mood table). En reposo: 80% saturación. En slow-mo/gol: 150%.
- **Color del glow del balón = color del último jugador que lo tocó.** Esto comunica posesión sin UI explícita. Cuando ningún jugador lo ha tocado (saque inicial): glow blanco neutro.

### UI palette
La UI usa la **misma paleta** que el mundo, no diverge. Esto refuerza la coherencia "todo es del mismo universo neón".
- Texto: `--ui-text` o `--ui-text-dim`
- Fondos de paneles: `transparent` o `rgba(0,0,0,0.6)`
- Acentos UI (botón hover, selección activa): cyan o magenta según jugador, o violeta para neutro

### Colorblind safety
- **P1/P2 distinción cyan vs magenta:** falla parcialmente para protanopia (ambos se acercan a un gris azulado). **Backup obligatorio:** posición fija (P1 siempre izquierda, P2 siempre derecha) + ring debajo del personaje (cyan = ring sólido continuo, magenta = ring punteado).
- **Verde lima de gol:** confirmado por flash full-screen + sonido + texto "GOAL P1/P2", nunca por color solo.
- **Naranja-rojo de special listo:** confirmado por shape (aura crece) y sonido, no solo color.

---

## 5. Character Design Direction

> **Aplicabilidad mínima:** este juego no tiene "personajes" en el sentido tradicional. Cada "personaje" es una cabeza-círculo + un special único. No hay rigging, no hay animación de pose, no hay LOD (todo se renderiza igual a cualquier zoom).

### Visual archetype del jugador
- Una cabeza-círculo de tamaño consistente (`HEAD_DIAMETER` en `tuning.js`).
- 2 ojos (puntos), 1 boca (línea), forma de boca define la personalidad del personaje (contento, cabreado, smug, sorprendido).

### Distinguishing features por personaje
Cada personaje se diferencia por:
1. **Forma de la boca** (sonrisa malvada, "O" sorprendida, línea recta seria, etc.)
2. **Detalles mínimos en la cabeza** (ej: 1 cuerno pequeño, 1 antena, ojos diferentes — siempre dentro del vocabulario geométrico de Section 3)
3. **Color de aura cuando special está cargado** (cada personaje tiene un acento semántico distinto: fuego = rojo, eléctrico = amarillo, hielo = cyan claro, etc.)
4. **Visual del special en sí** (ver Section 7 VFX)

### Expression/pose
- **Ninguna animación de pose corporal** — la cabeza no rota, no hay limbs.
- **Animación de boca:** cambia entre 2-3 frames según estado (idle, golpe, gol metido / encajado).
- **Squash & stretch del círculo:** scale Y bajo en aterrizaje, scale Y alto en salto inicial. Sutil, ~10%, suficiente para sentir peso.

### LOD philosophy
- **No LOD.** Todo se dibuja a la misma resolución siempre. La cabeza es ~64px de diámetro siempre.

---

## 6. Environment Design Language

> **Aplicabilidad mínima:** la "cancha" es un rectángulo negro con bordes apenas visibles + 2 porterías rectangulares. Hasta vertical slice no hay variación de estadios. En full release: estadios = palette swap (mismo geometría, distinto acento de color de glow del field-line y partículas ambient).

### Architectural style
- **Geometría plana, perpendicular, ortogonal.** Cancha = rectángulo. Porterías = rectángulos invertidos. Postes = líneas verticales con glow.
- **Sin perspectiva, sin profundidad.** Vista lateral pura 2D. La "Z" no existe.

### Texture philosophy
- **Sin texturas.** Color sólido + glow. Punto.

### Prop density
- **Densidad cero.** No hay props, no hay decoración, no hay "público de fondo". El campo es deliberadamente vacío para que el juego (cabezas + balón) tenga toda la atención.
- **Excepción permitida en vertical slice+:** partículas ambient muy sutiles flotando en el fondo (motas de neón a baja opacidad) para añadir profundidad atmosférica. Si entran en conflicto con legibilidad, se cortan.

### Environmental storytelling
- **Ninguno.** Anti-pillar: no hay narrativa. El estadio no cuenta una historia. Es escenario funcional, no diegético.

### Variación por estadio (post-vertical-slice)
- **Cambia:** color del field-line, color del ambient particle, color del flash de gol, música.
- **NO cambia:** geometría, dimensiones, posición de porterías, físicas del campo. Esto es por jugabilidad — todos los campos son justos.

---

## 7. UI/HUD Visual Direction

### Filosofía
- **Screen-space, no diegético.** El HUD vive sobre el mundo, no dentro.
- **Mismo vocabulario visual que el mundo** (rectángulos + glow + paleta neón). Se siente "del mismo universo".
- **Mínimo persistente.** Solo lo esencial siempre visible (score + timer). Todo lo demás aparece en su contexto.

### Capa HUD persistente (durante partida)

```
┌────────────────────────────────────────────┐
│  [P1 cabeza] 03 :  87  : 01 [P2 cabeza]    │ ← 32px alto, top center
│      [cyan]              [magenta]         │
│                                            │
│           [CANCHA + JUEGO]                 │
│                                            │
│ [special CD bar]            [special CD]   │ ← 4px alto, esquinas inferiores
└────────────────────────────────────────────┘
```

- **Score top:** mini-icon de cabeza del jugador (mismo color que el ingame) + número (font monospace, 32px, color del jugador).
- **Timer center top:** monospace 40px, blanco-azulado (`--ui-text`). Cuenta atrás. Bajo 10s: pulsa amarillo neón.
- **Special cooldown:** barra horizontal abajo en cada esquina, color del jugador. Vacía → llenándose → llena = special listo (aura del personaje empieza a brillar = redundancia visual).
- **Modifier indicator:** chip violeta con icono + nombre del modifier activo, abajo-centro de la pantalla. Permanente durante la partida si hay modifier.

### Tipografía
- **Numérica (score, timer):** monospace geométrica (sugerencia: `JetBrains Mono`, `Space Mono`, o web-safe `'Courier New'`). Números deben tener mismo ancho.
- **Texto narrativo (titles, button labels, modifier names):** sans serif geométrica (sugerencia: `'Space Grotesk'`, `'Rajdhani'`, fallback `system-ui`). Carácter "deportivo neón".
- **Tamaños:** title 64px / subtitle 32px / body 18px / caption 12px. Ratios consistentes.
- **Pesos:** solo 2 — Regular para body, Bold para titulares y números importantes.

### Iconography
- **Estilo:** outlined (línea fina con glow), no filled. Misma técnica visual que el mundo.
- **Resolución:** vector implícito — todos los iconos son geometría primitiva dibujada en código (Path2D), no PNG/SVG en MVP.
- **Set inicial:** ícono de cabeza (jugador), balón (gol/score), reloj (timer), bolt (special), cog (settings), 4-5 íconos de modifier (gravedad ↓, balón gigante ⊕, portería ▭, etc.)

### Animation feel para UI
- **Easing:** `cubic-bezier(0.25, 0.1, 0.25, 1)` para entradas (suave y rápido). `cubic-bezier(0.5, 0, 0.75, 0)` para salidas (acelera al final).
- **Duración:** 200ms para appearance/disappearance. 80ms para hover/state change. Nunca más de 400ms (regla: la UI no es protagonista).
- **Tipos de movimiento permitidos:** fade + scale (0.9→1.0 en entrada). Slide-in solo para banners de gol y end-of-match. NO bouncing, NO spring physics.

### UX cross-check
- ✅ **Legibilidad durante slow-mo:** la UI mantiene escala normal durante slow-mo (no se ralentiza). Garantiza lectura.
- ✅ **Lectura split-attention:** dos jugadores miran al centro (balón). Score arriba/centro está en zona de visión periférica para ambos.
- ⚠️ **Special cooldown en esquinas inferiores:** queda lejos del foco visual. Mitigación: aura del personaje también indica "listo" (redundancia), así el jugador puede mantener vista en el centro.
- ⚠️ **Modifier indicator abajo-centro:** puede competir con balón si el balón baja. Mitigación: opacidad 0.4, solo se ilumina cuando el modifier hace algo (event-driven flash).

---

## 8. Asset Standards

> **Esta sección es deliberadamente corta** — este proyecto no tiene pipeline de assets en MVP. Toda la "producción" sucede en código.

### Naming conventions
- **Audio files** (cuando entren): `kebab-case.ext` describiendo el evento sin contexto: `ball-hit-head.wav`, `goal-scored.wav`, `special-fire.wav`, `whistle-end.wav`, `ui-confirm.wav`. NO incluir el personaje o estadio en el filename — el código lo combina.
- **JS files**: ver Naming Conventions en `.claude/docs/technical-preferences.md` (kebab-case, una clase main por archivo).
- **Tuning constants**: en `tuning.js`, todos camelCase, agrupados por categoría (`physics.gravity`, `physics.restitution`, `juice.hitstopMs`, `juice.slowmoFactor`, `colors.p1`, `colors.p2`).

### Audio standards
- **Formato:** `.ogg` (mejor compresión + soporte web universal). Fallback `.mp3` si el browser no soporta ogg.
- **Sample rate:** 44.1kHz mono para SFX, 44.1kHz stereo para música.
- **Bit depth:** 16-bit (suficiente para web).
- **Loudness target:** -16 LUFS para música, -12 LUFS para SFX (head-room para layered hits).
- **Length budget:** SFX < 1.5s. Música loop < 60s con loop-point markers limpios.
- **Total audio payload:** < 2MB para MVP (mantener load instant en web).

### Visual standards (cuando entren sprites en post-MVP)
- **Formato:** `.png` con transparencia, optimizado con `pngquant` o equivalente.
- **Resolución:** sprite atlases máx 1024×1024px; texturas individuales múltiplos de 8px.
- **Estilo de sprite:** consistente con vocabulario de Section 3 (geométrico, silueta primero, glow halo opcional).

### Performance constraints (link a `.claude/docs/technical-preferences.md`)
- Total payload (HTML + JS + audio + sprites + fonts) **< 3MB en MVP, < 8MB en full release**.
- 60fps locked (ver tech-prefs Performance Budgets).
- Memoria runtime < 50MB.

---

## 9. Reference Direction

| Reference | Take from it | Avoid / diverge | Why |
|---|---|---|---|
| **Rocket League** (replays + juice) | Slow-mo automático en gol, screen shake escalado al impacto, pose triunfal del que metió, replay de la jugada | NO copiar el HUD complejo, NO 3D, NO car-like physics | Validación de que "juice cinemático en sports" es masivo |
| **Ikaruga** (visual contrast) | Negro + neón puro, 0 detalle de fondo, formas geométricas leíbles a cualquier velocidad | NO scrolling backgrounds, NO bullet patterns | Pureza visual extrema; high-contrast leíble bajo presión |
| **Hyper Light Drifter** (color-as-narrative) | Paleta restringida, semántica de color rígida, glow como "este objeto importa" | NO el detallismo pixel art retro, NO tonos pastel | Disciplina de paleta + jerarquía visual via brillo |
| **Vaporwave / synthwave aesthetic** (genérico) | Paleta cyan/magenta/violeta, tipografía geométrica neón, scanlines sutiles, chromatic aberration | NO romanticismo nostalgia 80s, NO motivos griegos/japoneses, NO grids de horizonte que distraigan | Atmósfera; no estética nostálgica |
| **Highlights de fútbol latino en TV** (cinematic patron) | Cámara lenta automática post-gol, repetición desde otro ángulo, narrador exagerado en spirit | NO comentaristas reales, NO public en fondo, NO tv overlays | Reverencia al "momento del gol" como evento sagrado |

**Lo que NO se busca y debe evitarse:**
- ❌ Estética cartoon flash-game amateur (Newgrounds 2008)
- ❌ Pixel art retro (no encaja con los pillars de juice + glow)
- ❌ Realismo estilo FIFA (anti-pillar)
- ❌ Estética minimalista flat design Apple/Google (sin glow ≠ Neón de Medianoche)

---

## Director Sign-Off

> **Art Director Sign-Off (AD-ART-BIBLE):** APPROVED 2026-05-11 (5 minor concerns logged, non-blocking)

### Minor concerns logged (resolve incrementally; do NOT block production)

1. **Silhouette-additive feature rule:** §5 menciona "1 cuerno, 1 antena" como diferenciadores. Añadir regla: features solo aditivos a la silueta, deben leer claramente a 32×32px.
2. **Shared `intensity` curve:** §3 (trail length scales with velocity) y §4 (saturation scales with momentum) deben usar una **misma curva** definida en `tuning.js` para no derivar en implementación. Sugerencia: `intensityFromVelocity(v) → 0..1`.
3. **Special-cooldown UX:** §7 ya self-flagged el riesgo (esquinas inferiores fuera de foco). Mitigación: aura redundante. Playtest hypothesis a validar en `/playtest-report` post-Tier-1.
4. **Ambient particle cap:** §6 menciona partículas ambient post-vertical-slice. Pre-comprometer `MAX_AMBIENT_PARTICLES = 30` en `tuning.js` cuando se introduzcan, para no romper budget en futuro.
5. **Gradient sprite cache invalidation:** documentar TODO en código del renderer — al cambiar paleta (stadium swap en full release) hay que invalidar y re-bake los radial gradients cacheados.
