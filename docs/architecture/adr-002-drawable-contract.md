# ADR-002: Renderer Drawable contract

## Status
Accepted

## Date
2026-05-11

## Last Verified
2026-05-11

## Decision Makers
Technical Director (TD-SYSTEM-BOUNDARY concern #2), user.

## Summary
Renderer depends only on `RenderContext + Tuning + a list of Drawables`. Each visible system implements `Drawable { zOrder, visible, draw(ctx, t, alpha) }` and registers itself with the Renderer. Renderer never imports PlayerCharacter, Ball, HUD, or any concrete type.

## Engine Compatibility

| Field | Value |
|---|---|
| Engine | None — Vanilla JS + Canvas 2D web |
| Domain | Rendering |
| Knowledge Risk | LOW |
| References Consulted | TD-SYSTEM-BOUNDARY verdict; `design/gdd/renderer.md`; art-bible.md |
| Post-Cutoff APIs Used | None |
| Verification Required | None |

## ADR Dependencies

| Field | Value |
|---|---|
| Depends On | ADR-001 (modular files needed to enforce non-import) |
| Enables | Tier 1 ParticleSystem (registers as Drawable) |
| Blocks | Renderer implementation |

## Context

### Problem Statement
The first systems-index draft listed Renderer with **7 direct dependencies** (RenderContext, Tuning, MatchState, PlayerCharacter, Ball, ParticleSystem, JuiceController). This is the highest God Object risk in the project. As Tier 1+ adds new entities (Special VFX, ambient particles, alternate stadium decoration), Renderer would grow to 10+ dependencies, with `if (entity instanceof X) ...` switches inside its render method. A second open question — whether HUD shares the render pass or has its own — was unresolved.

### Current State
No code yet. Systems-index has been revised to reflect this decision; per-system GDDs will follow the contract.

## Decision
Define a stable interface every visible system implements:

```js
// Conceptual interface (no formal types in JS)
class Drawable {
  zOrder = 10;       // higher = drawn later (on top)
  visible = true;
  draw(ctx, t, alpha) { /* paint into ctx */ }
}
```

Renderer keeps a `drawables: Drawable[]` registry, sorted by `zOrder` on register/unregister. Per frame, Renderer iterates the array and calls `drawable.draw(ctx, t, alpha)`. Renderer holds **zero references** to game-specific types.

zOrder convention codified in `renderer.md` §3.

## Consequences

### Positive
- **Renderer goes from 7 deps to 3** (RenderContext, Tuning, drawables list).
- **HUD/Renderer separation question dissolves** — HUD just becomes another Drawable with `zOrder ≥ 40`.
- **New visible systems plug in for free** — Tier 1 ParticleSystem implements Drawable, calls `renderer.register(this)`. Renderer code unchanged.
- **Testable:** Renderer can be tested with stub Drawables; entities can be tested without Renderer.
- **zOrder is data, not control flow** — re-layering is changing a number, not editing Renderer.

### Negative
- **Indirection cost:** every visible system must define `zOrder`, `visible`, `draw`. Trivial for entities (3 lines), small ceremony for one-off overlays.
- **No type checking in JS** — any object missing `draw` will crash at first frame. Mitigation: `Renderer.register()` validates the contract at registration time, throws clear error if missing.
- **`draw` cannot return data** (it's render side-effect only). Systems needing computed render data must store it on themselves before `draw` runs. Standard for any retained-mode renderer.

### Neutral
- **Render order via integer zOrder** is simple but coarse. If post-VS we need conditional ordering (e.g., "always draw P1 above P2 unless P2 is special-firing"), a comparator function field can be added without breaking existing Drawables.

## Alternatives Considered

### Alt A: Renderer owns concrete `if (entity instanceof Ball) drawBall(...)`
- Pro: easiest to start.
- Con: God Object guaranteed by Tier 1; new entity = edit Renderer.
- **Rejected** — TD verdict.

### Alt B: Each system has its own `render()` method called directly from `main.js`
- Pro: zero contract.
- Con: order is hardcoded in main.js, no central `clear/composite/post` pipeline, every system needs RenderContext directly.
- **Rejected** — moves the God Object to main.js, doesn't solve it.

### Alt C: Component/ECS architecture
- Pro: maximum flexibility.
- Con: massive over-engineering for 14 systems, first-time dev unfamiliar, adds many concepts.
- **Rejected** — wrong scope.

## Implementation Notes
- `Drawable` is a duck-typed contract — no base class required, no formal interface (JS has none). A plain object `{ zOrder: 30, visible: true, draw: (ctx) => {...} }` is a valid Drawable.
- `Renderer.register(drawable)` validates the shape: `typeof drawable.draw === 'function'`, `Number.isFinite(drawable.zOrder)`, `typeof drawable.visible === 'boolean'`. Throws on failure.
- `Renderer.unregister(drawable)` removes by reference (not by name) — caller keeps the reference if it needs to remove.
- zOrder ties broken by insertion order (stable sort).
- Renderer wraps each `draw` call in `try/catch` and continues on error (one buggy drawable shouldn't kill the frame).

## Verification
Re-verify if:
- A drawable type needs render-stage interleaving that integer zOrder can't express (then add comparator field).
- Multiple sub-Renderers emerge (e.g., off-screen render-targets in vertical-slice) — may need `Drawable` to declare which target.
