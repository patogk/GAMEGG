# MEGA HEAD CUP

> 1v1 local arcade soccer en web. Cabezones, golazos cinemáticos, pique de sofá puro.
> Built with Vanilla JS + HTML5 Canvas 2D. No build, no framework, no engine.

**Status:** Tier 0 prototype (validating cabezazo + gol = divertido).

---

## Cómo jugar (local)

Por ADR-001 (modular ES modules), el navegador necesita servir los archivos vía HTTP — abrirlo desde `file://` falla por CORS.

```bash
# Cualquiera de estas opciones funciona, desde la raíz del repo:
python3 -m http.server 8000
# o
npx serve
```

Luego abrí http://localhost:8000 (o el puerto que indique el server).

## Controles

- **Jugador 1:** `A` `D` mover · `W` saltar
- **Jugador 2:** `←` `→` mover · `↑` saltar
- **R** reset de partida
- **Esc** (Tier 1) pausa

## Estructura

```
GAMEGG/
├── index.html              ← entrada
├── src/                    ← todo el código (modular ES modules per ADR-001)
│   ├── main.js             ← bootstrap
│   ├── tuning.js           ← magic numbers (single source of truth)
│   ├── engine/             ← Foundation: event-bus, game-loop, input-bus, render-context
│   ├── game/               ← Core + Feature: physics, collision, match-state, player, ball
│   └── render/             ← Presentation: renderer (Drawable contract), hud
├── design/                 ← GDDs, art bible, systems index
├── docs/architecture/      ← architecture.md + ADRs
└── .claude/                ← Claude Code Game Studios framework
```

## Documentación

- **Concepto:** `design/gdd/game-concept.md`
- **Art bible:** `design/art/art-bible.md`
- **Systems index:** `design/gdd/systems-index.md`
- **Architecture:** `docs/architecture/architecture.md`
- **ADRs:** `docs/architecture/adr-*.md`

## Próximos pasos (Tier 1 — 2-3 semanas)

- [ ] AudioContext + AudioPlayer + 8 SFX core
- [ ] JuiceController (slow-mo + screen shake + glow trails) — supersede ADR-004
- [ ] ParticleSystem
- [ ] Specials por personaje (1 botón, 1 efecto)
- [ ] ModifierSystem con 3 modificadores iniciales
- [ ] MainMenu + CharacterSelect + ResultScreen
- [ ] KeyboardCalibration al boot (6KRO test)
- [ ] DebugOverlay con dat.gui

---

> Construido sobre [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (49 agents, 72 skills, 12 hooks, 11 rules) — todo el flujo `/brainstorm → /art-bible → /map-systems → /design-system → /create-architecture → /prototype` documentado en `design/` y `docs/architecture/`.
