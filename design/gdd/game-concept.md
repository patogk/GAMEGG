# Game Concept: MEGA HEAD CUP

*Created: 2026-05-11*
*Status: Draft — Pillars locked, Visual Anchor locked, scope adjusted per TD/PR gates*

---

## Elevator Pitch

> **It's a 1v1 local arcade soccer game where two cabezones se rompen la cara con cabezazos y specials cinemáticos para meter golazos en una cancha de neón, jugado en el mismo teclado para máximo pique entre amigos.**

10-second test: arcade soccer + 1v1 same-couch + golazos absurdos con juice AAA. Listo.

---

## Core Identity

| Aspect | Detail |
| ---- | ---- |
| **Genre** | Arcade Sports / Versus Fighting (subgénero: party 1v1) |
| **Platform** | Web / Browser (HTML5 canvas, sin build step) |
| **Target Audience** | 15–35, casual-mid, juega con amigos en casa, fan de Head Soccer / FIFA / PES |
| **Player Count** | 2 (1v1 local same-keyboard). IA opcional post-MVP. |
| **Session Length** | 5–30 min (partidas BO1 de 90s, encadenables) |
| **Monetization** | Ninguna (juego gratis, web abierto). Sin lootboxes, sin energía, sin ads. |
| **Estimated Scope** | Tiered — Tier 0: 1 sesión (4–8h) · Tier 1 (MVP): 2–3 semanas solo · Vertical slice: 6–10 semanas · Full release: 5–8 meses solo |
| **Comparable Titles** | Head Soccer (mobile), Stickman Soccer, Soccer Stars, Sociable Soccer, Rocket League (juice reference) |

---

## Core Fantasy

> **"Soy una bestia goleadora ridícula que mete golazos imposibles y deja en ridículo al amigo sentado al lado."**

La fantasía no es ser un futbolista profesional — es ser ese tipo que mete chilena de fuego desde mediocampo en cámara lenta y le hace bullying al rival mientras se levanta con la mano arriba. La fantasía es **el momento del trash-talk**. El balón es la excusa.

Lo que el jugador puede hacer aquí que no puede en otro juego:
- **Restregarle un golazo cinemático en la cara a un humano sentado a 50cm**, en formato instant-play web (sin instalar nada)
- Mezclar la **inmediatez arcade de Head Soccer** con la **percepción de peso AAA** de Rocket League
- Disfrutar **modificadores absurdos rotativos** que cambian la partida sin cambiar el juego

---

## Unique Hook

> **"Como Head Soccer, AND ALSO con feedback cinemático AAA (slow-mo automático en gol, screen shake escalado, hitstop pesado) + un modificador random pre-partida (gravedad lunar, balón gigante, portería diminuta, etc.)."**

Tres componentes:
1. **Juice AAA en formato web casual** — nadie hace esto. Head Soccer es plano. Rocket League es 3D pesado.
2. **Modificadores rotativos** — variedad sin complejidad. Cada partida se siente fresca.
3. **Same-keyboard 1v1** — puro pique de sofá. Cero fricción de matchmaking.

---

## Visual Identity Anchor — NEÓN DE MEDIANOCHE

*Locked via AD-CONCEPT-VISUAL gate, 2026-05-11. Verdict: STRONG.*

### One-line visual rule
> **El campo es negro vacío — solo existe lo que emite luz.**

### Mood
Rocket League meets Ikaruga meets una cancha de futsal a las 3am. Vaporwave deportivo. Trails, glow, scanlines sutiles. Saturación al máximo en momentos de impacto.

### Shape language
Geometría dura, angular, casi vectorial. Personajes silueta + un acento de color. El balón es un orbe con halo. Cero detalle interno — pura silueta. Outline grueso luminiscente.

### Color philosophy
Fondo negro absoluto + 2 neones por jugador (cyan vs magenta default). Otros colores reservados:
- **Blanco / amarillo neón:** momento de impacto, contacto balón-cabeza
- **Rojo / naranja:** special cargado, peligro inminente
- **Verde lima:** gol confirmado (flash de pantalla)

Glow intensifica con el momentum del jugador. Slow-mo = saturación máxima + chromatic aberration leve.

### Por qué sirve los pillars
- **PESO Y JUICE (P4):** la dirección está construida *para* juice — particles, glow y shake leen 10x mejor sobre negro. El arte ES el feedback.
- **GOLAZO O NADA (P1):** el flash neón en cada gol vuelve cualquier captura de pantalla compartible.
- **EL PIQUE (P3):** el contraste cyan/magenta lee instantáneo en split-attention de couch-coop.

### Costo de producción
**Mínimo para solo-dev web.** Primitivas (círculos, rects) + Canvas 2D `globalCompositeOperation = 'lighter'` con gradientes radiales pre-renderizados. Sin pipeline de sprites. Sin animación frame-by-frame. Las particles y los shaders fake hacen el trabajo del arte.

---

## Player Experience Analysis (MDA Framework)

### Target Aesthetics

| Aesthetic | Priority | How We Deliver It |
| ---- | ---- | ---- |
| **Sensation** (sensory pleasure) | **1 (Primary)** | Hitstop pesado, slow-mo automático, screen shake escalado, glow neón, audio bajo profundo |
| **Fellowship** (social connection) | **2** | 1v1 same-couch keyboard, trash-talk emergente, replay automático para humillar |
| **Challenge** (mastery) | **3** | Skill ceiling balanceado: timing de specials, posicionamiento, ejecución mecánica |
| **Expression** (self-expression) | **4** | Selección de personaje (cada uno con special único), elección de modificador |
| **Discovery** | 6 | Modificadores variados; encontrar combos personaje × modificador favoritos |
| **Fantasy** | 7 | Personajes-cabeza estilizados; mundo de neón |
| **Submission** | N/A | Anti-pillar: este juego no es relax |
| **Narrative** | N/A | Anti-pillar: cero historia |

### Key Dynamics (comportamientos emergentes esperados)
- **Trash-talk en couch:** los jugadores narran sus propios goles ("¡toma, toma!")
- **"Una más" loop:** partidas de 90s → revancha en un click → 30 min se van volando
- **Meta-juego de modificadores:** elegir modifier para sabotear el style del rival ("vamos con balón gigante porque a vos te jode")
- **Picadas con personaje específico:** "yo siempre con el del fuego, vos con el del rayo"
- **Compartir capturas:** screenshots de goles cinemáticos en chats de WhatsApp/Discord

### Core Mechanics (sistemas a implementar)
1. **Físicas 2D weighty** — gravedad alta, balón pesado, fricción ajustada para sentir peso. Colisión circle-circle (cabeza-balón) y AABB (suelo, postes, muros).
2. **Sistema de specials** — un botón por personaje, cooldown ~5s, efecto único por personaje (impulso de fuego, freeze, multi-balón, salto-gigante, etc.). Capped a "un botón, un efecto" por decisión PR-SCOPE.
3. **Cinematic feedback layer** — hitstop ≥400ms en gol, slow-mo (`dt *= 0.15`) por 600ms en specials/goles, screen shake con envelope, particle bursts.
4. **Modifier system** — modifiers como funciones puras hookeadas a eventos (`onBallUpdate`, `onGravityResolve`, `onGoalScored`). Cap a 1 por partida en MVP.
5. **Match flow** — pre-partida (selección personaje + roulette de modifier), partida 90s, post-partida (slow-mo replay del gol final + score + revancha).

---

## Player Motivation Profile

### Self-Determination Theory

| Need | How This Game Satisfies It | Strength |
| ---- | ---- | ---- |
| **Autonomy** | Elegís personaje (cambia el sabor mecánico), modificador (cambia las reglas), cuándo disparar specials | Supporting |
| **Competence** | Curva de mastery clara: 5 partidas → entendés controles. 50 partidas → leés al rival. 500 partidas → dominás timing de specials. | **Core** |
| **Relatedness** | Same-couch local: el otro humano ES la fuente de relación. Trash-talk emergente. | **Core** |

### Player Types (Bartle)

- **[X] Killers/Competitors (PRIMARIO):** dominar al rival, ganar BO3, presumir golazos
- **[X] Socializers (PRIMARIO):** la gracia es el otro humano sentado al lado
- **[X] Achievers (SECUNDARIO):** desbloquear personajes, completar challenges ("gana 10 partidas con balón gigante")
- **[ ] Explorers:** no es lo nuestro — el juego no tiene secretos profundos

### Flow State Design

- **Onboarding curve:** primer partida sin tutorial. Calibración de teclado obligatoria (5 segundos). Cartel "moverse / saltar / shoot" en pantalla los primeros 10s.
- **Difficulty scaling:** balance natural entre humanos. Para single-player futuro: 3 niveles de IA (fácil = lenta y reactiva, media = anticipa, hard = trash-talkea).
- **Feedback clarity:** todo lo importante (cooldown special, score, timer) en pantalla, gigante, claro.
- **Recovery from failure:** después de gol, saque desde el centro en 1.5s. Después de partida: revancha en 1 click. Cero fricción.

---

## Core Loop

### Moment-to-Moment (30 segundos)
Mover izq/der + saltar + cabecear el balón. El **feel** es **PESADO Y SATISFACTORIO**: cada toque hace "thud" con bajo profundo + 2-3 frames de freeze en hits fuertes. Balón viaja rápido pero pesado (alta gravedad, alta velocidad inicial), más como disco de hockey que como pelota de playa.

### Short-Term (90 segundos = una partida)
BO1 a 90 segundos. Quien tiene más goles gana. Si empate: muerte súbita (next goal wins, 30s extra). Cada gol → hitstop 400ms → slow-mo 600ms → flash verde lima → saque centro.

### Session (15–30 minutos)
Grupo de amigos juega ~10 partidas seguidas, rotando personajes. El gancho es el **trash-talk acumulado**. Apuestas informales ("pierde lava los platos") emergentes.

### Long-Term Progression
- **Desbloqueo de personajes** cumpliendo retos sencillos ("gana 5 partidas con special de fuego" → unlock personaje del rayo). Sin grind real, todo unlock rápido (~3 partidas por personaje nuevo).
- **No hay XP global, no hay niveles, no hay loot.** Sin gacha. Sin temporadas. Es un juego de habilidad y party.
- **Hall of Fame local (POST-V1):** mejores goles guardados como GIF (deferred per PR-SCOPE).

### Retention Hooks
- **Curiosidad:** "¿qué hace el special del personaje que no probé?", "¿qué pasa con el modifier de gravedad lunar?"
- **Inversión:** progreso de unlock visible, picada con un amigo recurrente
- **Social:** el amigo te dice "vamos otra"
- **Mastery:** mejorar el timing del special; aprender qué modifier sabotea a quién

---

## Game Pillars

*Locked via CD-PILLARS gate, 2026-05-11 (sharpened per CONCERNS).*

### Pillar 1: GOLAZO O NADA
Cada gol debe sentirse cinemático, exagerado y compartible. Si un gol no haría reír o gritar, falló nuestro diseño.

*Design test:* Si debatimos entre realismo físico y golazo absurdo → siempre golazo absurdo.

### Pillar 2: DOS BOTONES, MIL JUGADAS
Aprendes en 30 segundos, dominas en 30 horas. Acceso casual, profundidad real.

*Design test:* Si una mecánica requiere tutorial → la simplificamos o la cortamos.

### Pillar 3: EL PIQUE ES EL JUEGO
Diseñamos para 1v1 same-couch y para que cada gol sea un acto de **humillación compartida**. Cada victoria debe darle al ganador algo que restregar al rival (replay, taunt, sticker compartible).

*Design test:* Si una feature mejora single-player o no produce un momento "para restregárselo" → fuera.

### Pillar 4: PESO Y JUICE SOBRE TODO
Cada acción importante (gol, special, parry) tiene feedback AAA: shake, slow-mo, audio bajo, freeze frames. Sentir > ver.

*Design test (medible):* Cada gol = ≥400ms hitstop + slow-mo automático. Cada special = ≥600ms slow-mo. Tope duro: el juego nunca baja de 60fps en web. Si un efecto rompe el budget de 60fps → se recorta el efecto, no el framerate.

*Resolución de tensión P2 ↔ P4:* En **acciones comunes** (movimiento, pases, toques) gana **P2 (responsividad)** — sin hitstop. En **acciones raras pero importantes** (gol, special, parry) gana **P4 (juice)**.

### Pillar 5: VARIEDAD QUE PROVOCA RISA
Los modificadores rotativos existen para crear momentos memorables, no para añadir complejidad. Si un modificador no produce risa o WTF en su primera partida → fuera.

*Design test:* Si un modificador requiere explicación previa para entenderse → fuera.

### Anti-Pillars (lo que NO somos)

- **NO somos sim de fútbol** — no hay 11 jugadores, no hay tácticas de equipo, no hay manager. Sí podemos tener arquero como personaje seleccionable.
- **NO somos free-to-play con energía** — sin timers, sin lootboxes, sin grind real para personajes. Cosmético = unlock por jugar.
- **NO somos online competitivo ranked** — el matchmaking online y los servidores nos romperían el scope. Local primero, *quizás* online por código de sala post-v1.
- **NO somos historia/narrativa** — no hay torneo con cinemáticas, no hay personajes con backstory de 3 párrafos. Cada cabeza tiene 1 línea de lore y un trash-talk corto.

---

## Inspiration and References

| Reference | What We Take From It | What We Do Differently | Why It Matters |
| ---- | ---- | ---- | ---- |
| **Head Soccer (mobile)** | Cabezones, 1v1, specials únicos por personaje, partidas cortas | Juice AAA cinemático (Head Soccer es plano), web local 2P en vez de mobile single-player + IA | Validación de mercado: 100M+ descargas, demanda probada |
| **Rocket League** | Sentido de peso del balón, juice en goles (slow-mo, screen shake), ladder de skill | 2D vs 3D, local same-couch vs online, simple vs complejo | Demuestra que la fantasía de "golazo cinemático" tiene mercado masivo |
| **FIFA / PES** | Reverencia al fútbol como deporte, el momento del gol | Arcade puro, sin tácticas, sin licencias | Emocional anchor del usuario; sabe que les gusta el "sabor" de fútbol |
| **Smash Bros (party)** | Selección de personaje con identidad mecánica, items random (=modifiers), 4 player chaos | 1v1 estricto, sin items en gameplay (modifier es pre-partida) | Modelo de party game con depth real |
| **Gang Beasts** | Ridículo físico, trash-talk emergente, party local | Más preciso, menos floppy | Modelo de party game web/casual con loop social fuerte |
| **Nuclear Throne / Hyper Light Drifter** | Juice cinemático, screen shake, hitstop como diseño | Aplicado a sports en vez de roguelike | Prueba que juice extremo funciona |

**Non-game inspirations:**
- **Vaporwave / synthwave aesthetic** (cyan/magenta, neón, scanlines)
- **Highlights de fútbol latino en TV** (cámara lenta, repetición, narración exagerada)
- **Trash-talk de Twitch streamers de party games** (Among Us, Fall Guys)

---

## Target Player Profile

| Attribute | Detail |
| ---- | ---- |
| **Age range** | 15–35 |
| **Gaming experience** | Casual a mid-core. Jugaron Head Soccer en mobile, FIFA/PES en consola, Mario Kart en couch. |
| **Time availability** | Sesiones cortas (5–30 min) en cualquier momento. Picos largos cuando hay amigos. |
| **Platform preference** | Web/browser para acceso instantáneo. Laptop o PC compartido. |
| **Current games they play** | Head Soccer, FIFA, PES, Rocket League, Mario Kart, Smash, Gang Beasts |
| **What they're looking for** | Algo que abrir en 5 segundos y jugar con un amigo sin instalar, sin cuenta, sin ads. Diversión instantánea de pique. |
| **What would turn them away** | Tutorial largo. Login. Loading screens. Microtransactions. UI sucia. Latencia. |

---

## Technical Considerations

| Consideration | Assessment |
| ---- | ---- |
| **Recommended Engine** | **Vanilla JS + Canvas 2D**. Cero build step, cero dependencias, abrir `index.html` y jugar. Total control sobre 60fps budget. Ideal para primer juego web. |
| **Key Technical Challenges** | (1) Tuning de feel sin editor, (2) 2-player same-keyboard rollover (6KRO limit), (3) mantener 60fps con juice apilado, (4) Web Audio autoplay policies, (5) modifier system clean architecture |
| **Art Style** | Primitivas geométricas + Canvas `globalCompositeOperation = 'lighter'` + radial gradients pre-renderizados para glow. Cero sprite pipeline en MVP. |
| **Art Pipeline Complexity** | **Bajo** — código dibuja todo. Sprites opcionales post-vertical-slice. |
| **Audio Needs** | Moderado: ~10 SFX core (kick, hit, jump, special, goal, whistle, crowd, ui-click, ui-confirm, music loop). Web Audio API (no `<audio>`). Init lazy en primer input. |
| **Networking** | Ninguna en v1. Online por código de sala = post-v1.1 si validamos demanda. |
| **Content Volume** | MVP: 2 personajes, 1 cancha, 1 modifier opcional. Vertical slice: 4 personajes, 1 cancha, 3 modifiers. Full release: 8–12 personajes, 3 canchas (palette swap), 6–8 modifiers. |
| **Procedural Systems** | Ninguno. Todo authored. |

### Stack técnico concreto
- **Render:** Canvas 2D
- **Loop:** `requestAnimationFrame` con fixed timestep accumulator (1/120s sub-steps)
- **Físicas:** semi-implicit Euler, colisión circle-circle (balón-cabeza, balón-pies), AABB (suelo, postes, paredes), restitución 0.6, fricción aire 0.99
- **Input:** `keydown`/`keyup` con state map. Layout 6KRO-safe: P1 = `WASD + G + H`, P2 = `Arrows + , + .`
- **Audio:** Web Audio API, `AudioContext` lazy-init en primer input, decode upfront, schedule con `audioCtx.currentTime`
- **Tuning:** `tuning.js` con todas las magic numbers + overlay `dat.gui` (CDN script) toggle con tilde, persist a localStorage
- **Storage:** localStorage para unlocks, settings, mejor score
- **Build:** ninguno. ES modules nativos. `index.html` + `src/*.js`. Funciona desde `file://` o cualquier static server.

---

## Risks and Open Questions

### Design Risks
- **El feel del cabezazo no es divertido en aislamiento.** Si el momento-a-momento no se siente bien antes de añadir juice, no hay juego. → Tier 0 valida esto en una sesión.
- **Hitstop molesta al rival que no metió el gol.** El otro jugador es "espectador forzoso" durante el slow-mo. → Mitigar: que el slow-mo sea corto (600ms max), claro, y comunique narrativa ("¡le metieron!").
- **Modifiers desequilibran competencia seria.** Aceptar: este juego no es para esports. Modifiers son feature, no bug.

### Technical Risks
- **Keyboard ghosting / 6KRO limit.** REAL. → Layout 6KRO-safe + screen de calibración al boot que detecta drops.
- **60fps budget con juice apilado.** Glow con `shadowBlur` es brutal. → Pre-bake glow como gradientes radiales en composite `lighter`. Profile early.
- **Replay system es trampa para primer dev.** → CUT. Usar `dt *= 0.15` por 600ms (mismo efecto cinemático, cero arquitectura).
- **Tuning sin editor mata productividad.** → Dat.gui overlay en semana 1, no después.

### Market Risks
- **Web games tienen ARPU bajo.** Aceptar: este es proyecto de portfolio + juego con amigos, no commercial. Gratis, sin monetización.
- **Saturación de soccer games en web.** Diferenciador = juice AAA + modifiers. Underexplored en web.
- **Couch coop está muerto en mobile, pero sigue vivo en PC/web.** Validación: Gang Beasts, Stick Fight, Duck Game tienen audiencia.

### Scope Risks
- **El sistema de replay/Hall-of-Fame.** El single mayor riesgo de scope creep. → DEFERRED hard a post-v1.1 (`BACKLOG.md`).
- **Per-character specials.** Cada uno es mini-design problem. → Cap a "un botón, un efecto", budget 1-2 días por special, resistir "uno más".
- **Estadios con geometría única.** → Palette swaps hasta post-launch.
- **Audio dinámico.** → SFX estáticos en v1.

### Open Questions
- ¿Cuál es el feel ideal de gravedad y velocidad de balón? → Resolver en Tier 0 con dat.gui sliders.
- ¿1 modifier o múltiples stack en MVP? → 1 sólo, aceptar limitación.
- ¿Single-player con IA es necesario en v1, o puro local 2P? → Puro local 2P en MVP. IA en vertical slice si hay tiempo.
- ¿Se siente bien el `dt *= 0.15` slow-mo, o necesita curva de easing? → Validar en Tier 1.
- ¿Cómo comunicamos "te toca a vos defender" sin UI invasiva? → Probar: ningún UI, dejar que la posición del balón guíe.

---

## MVP Definition

**Core hypothesis:** *El cabezazo + el feedback cinemático de gol son intrínsecamente divertidos en 1v1 local same-keyboard, sin necesidad de specials, modifiers, o roster.*

### Tier 0 — HOY (1 sesión, 4–8h)

Validación mínima de la hipótesis nuclear: ¿es divertido el head-on-ball physics?

**Required:**
1. Cancha 2D plana, 2 porterías rectangulares, fondo negro
2. 2 personajes idénticos (círculo con 2 ojos, sin animación), uno cyan uno magenta
3. Movimiento: izq/der + salto. Sin patada — solo cabezazo (cuerpo del player choca con el balón)
4. Físicas balón: gravedad, rebote contra suelo/postes/paredes, impulso al chocar con cabeza
5. Detección de gol → score++ → reset al centro tras 1.5s
6. Timer 60 segundos visible
7. Tecla R para reset full
8. **Un solo elemento de juice: hitstop 150ms en gol** (proof-of-concept del pillar 4)
9. P1 = `WASD`, P2 = `Arrows + space`
10. `tuning.js` + dat.gui overlay (toggle tilde) con sliders de gravedad, restitution, jump-force, run-speed

**Explicitly NOT in Tier 0:**
- Specials, modifiers, menú, sonido, partículas, glow, slow-mo, multiple chars, art

### Tier 1 — MVP completo (2-3 semanas)

Validación del concepto pleno: ¿el juice + specials + modifier completan la fantasía?

**Required:**
1. Todo de Tier 0
2. 2 personajes con special único cada uno (un botón, un efecto: ej. impulso de fuego direccional vs salto-mega)
3. Match flow: pre-partida (selección personaje + roulette de 1 modifier random de pool de 3) → partida 90s BO1 → post-partida (slow-mo del gol final + score + revancha en 1 click)
4. Juice completo per pillar 4: hitstop 400ms en gol, slow-mo 600ms (`dt *= 0.15`), screen shake escalado, particle burst en cada hit, glow neón en personajes y balón
5. 3 modifiers iniciales: low gravity, balón gigante, portería pequeña
6. Audio: 8 SFX core + 1 música loop
7. Layout 6KRO-safe (P1: `WASD + G + H` / P2: `Arrows + , + .`) + screen de calibración al boot
8. Visual pass "Neón de Medianoche": negro absoluto + glow + trails

**Explicitly NOT in Tier 1:**
- Replay real, Hall of Fame, GIF export, IA, online, unlocks, multiple stadiums, character lore

### Vertical Slice (~6–10 semanas adicionales tras Tier 1)
- 4 personajes con specials distintos
- 6 modifiers, sistema de roulette pulido
- Main menu + character select polished
- Music + SFX completos (10+ sounds)
- BO3 match structure
- IA básica para single-player (3 niveles)

### Full Release (~5–8 meses adicionales tras vertical slice)
- 8–12 personajes
- 6–8 modifiers
- 3 estadios (palette swaps)
- Sistema de unlocks por challenges
- Settings + rebindable keys
- Replay system (auto-capture últimos 3s, replay tras gol) — *si demanda valida*

### Cut Forever (o post-v1.1+)
- Hall of Fame / GIF export (rabbit hole técnico)
- Online ranked competitivo
- Character lore / story mode
- Dynamic audio system
- Géneros únicos por estadio (vs palette swap)

### Scope Tiers (timeline summary)

| Tier | Content | Features | Timeline (solo, evenings) |
| ---- | ---- | ---- | ---- |
| **Tier 0** | 1 char, 1 cancha plana | Físicas + hitstop + score | 1 sesión (4–8h) |
| **Tier 1 (MVP)** | 2 chars + specials, 1 modifier opcional | Match flow completo, juice completo, audio mínimo | 2–3 semanas |
| **Vertical Slice** | 4 chars, 3 modifiers, IA básica | Menus, audio completo, BO3 | +6–10 semanas |
| **Full Release** | 8–12 chars, 6–8 modifiers, 3 estadios | Unlocks, settings, replay | +5–8 meses |

---

## Director Verdicts (audit trail)

| Gate | Date | Verdict | Action taken |
| ---- | ---- | ---- | ---- |
| **CD-PILLARS** | 2026-05-11 | CONCERNS (5 items) | Pillars sharpened: P3 owns humillación social, P4 measurable, added P5 for modifiers, resolved P2↔P4 tension |
| **AD-CONCEPT-VISUAL** | 2026-05-11 | STRONG | Locked "Neón de Medianoche" |
| **TD-FEASIBILITY** | 2026-05-11 | CONCERNS (3 constraints) | Cut replay system, lock 6KRO-safe layout, build dat.gui overlay week 1 |
| **PR-SCOPE** | 2026-05-11 | REALISTIC (with adjustments) | Two-tier MVP (Tier 0 today + Tier 1 MVP), cut Hall of Fame, cap specials to "one button one effect", stadiums = palette swaps |

---

## Next Steps

- [ ] Run `/setup-engine` to formally configure the web/JS stack and populate version-aware reference docs
- [ ] Run `/art-bible` to expand "Neón de Medianoche" anchor into a full visual identity spec
- [ ] Run `/design-review design/gdd/game-concept.md` to validate concept completeness
- [ ] (Opcional) Discutir vision con `creative-director` agent para refinar pillars
- [ ] Run `/map-systems` para descomponer en sistemas y dependencies
- [ ] Run `/design-system` por sistema (físicas, specials, modifiers, match-flow)
- [ ] Run `/create-architecture` para blueprint técnico + Required ADRs
- [ ] Run `/architecture-decision (×N)` para cada decisión clave (físicas, audio, modifier system)
- [ ] Run `/gate-check` antes de comprometer a producción
- [ ] Run `/prototype core-physics` (= Tier 0) para validar core loop
- [ ] Run `/playtest-report` tras prototipo
- [ ] Si validado, `/sprint-plan new` para planear primer sprint (Tier 1)
