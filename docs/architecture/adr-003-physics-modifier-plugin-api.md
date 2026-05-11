# ADR-003: Physics Modifier plugin API (frozen surface)

## Status
Accepted

## Date
2026-05-11

## Last Verified
2026-05-11

## Decision Makers
Technical Director (TD-SYSTEM-BOUNDARY concern #3), user.

## Summary
Modifiers are NOT pure pub/sub event subscribers — they are documented Physics plugins with a frozen 3-method surface: `onPreIntegrate(entity, dt)`, `onPostIntegrate(entity, dt)`, `onCollisionResolve(manifold)`. Anything that needs more is a real new system, not a modifier.

## Engine Compatibility

| Field | Value |
|---|---|
| Engine | None — Vanilla JS + Canvas 2D web |
| Domain | Physics |
| Knowledge Risk | LOW |
| References Consulted | TD-SYSTEM-BOUNDARY verdict; `design/gdd/physics.md`; `design/gdd/collision.md`; `design/gdd/systems-index.md` |
| Post-Cutoff APIs Used | None |
| Verification Required | None |

## ADR Dependencies

| Field | Value |
|---|---|
| Depends On | ADR-001 |
| Enables | ModifierSystem authoring (Tier 1); GDDs for individual modifiers (Tier 1+) |
| Blocks | Physics implementation (need API decided before coding the integrator) |

## Context

### Problem Statement
The systems-index originally said modifiers "hook to events `onBallUpdate`, `onGravityResolve`, `onGoalScored`". TD flagged that `onGravityResolve` is **not** pub/sub — modifiers actually need to *mutate* the integrator's intermediate values mid-step. Pretending it's event-based hides that modifiers ARE physics extensions, which leads to either (a) modifier authors importing Physics internals (tight coupling) or (b) Physics emitting fake "events" that are really mutation APIs in disguise.

Either path produces a fragile boundary that grows worse with each new modifier (current MVP catalog: low-gravity, giant-ball, tiny-goal, no-ball-gravity, bouncy-walls, lava-floor — 6 distinct intervention shapes).

### Current State
No code yet. Modifiers planned for Tier 1.

## Decision
Define modifiers as objects implementing any subset of the following contract:

```js
const lowGravityModifier = {
  name: 'low-gravity',
  onPreIntegrate(entity, dt) {
    entity.gravityScale = 0.3;   // applied before gravity step
  },
  // onPostIntegrate(entity, dt) { ... }   // optional
  // onCollisionResolve(manifold) { ... }  // optional
};

physics.registerModifier(lowGravityModifier);
```

Physics calls each registered modifier's hooks at the appropriate point in `step()`. Hooks not implemented are skipped.

**The 3 hooks are the entire surface.** No additional hooks will be added without a new ADR superseding this. If a modifier needs more (e.g., on-input, on-render), it's a sign that the modifier should be a real system, not a modifier.

## Consequences

### Positive
- **Clear extension point.** Modifier authors know exactly what they can do. No spelunking in Physics internals.
- **Frozen surface = stable contract.** Adding modifiers in Tier 1+ never modifies Physics.
- **Ordering is explicit:** `onPreIntegrate` runs before gravity (good for changing gravityScale); `onPostIntegrate` runs after integration (good for teleport, wrap, lava-floor "kill velocity"); `onCollisionResolve` runs before impulse application (good for bouncy-walls multiplier).
- **Modifiers compose** by ordering: Physics applies modifiers in registration order; effects multiply naturally for `gravityScale`, additive for impulse multipliers.
- **Cap modifier stacking at 1 in MVP/Tier 1** keeps ordering questions theoretical until vertical-slice.

### Negative
- **Some modifiers genuinely don't fit the 3 hooks** (e.g., a "double-score" modifier touches ScoreSystem, not Physics — it's not a Physics modifier, it's a different kind of modifier). Resolution: ScoreSystem can have its own (smaller) modifier surface if needed. Don't shoehorn into Physics.
- **Modifier mutating shared `entity` state has aliasing risk.** If two modifiers both set `entity.gravityScale`, the second wins. Document: modifiers SHOULD use multiplicative composition (`entity.gravityScale *= 0.3`) when possible, not assignment. ModifierSystem GDD will codify this.
- **No async hooks.** `onPreIntegrate(entity, dt)` is sync. Modifiers cannot do I/O. Acceptable — Physics is sync by design.

### Neutral
- **Frozen API is a commitment** that may bite if a future modifier genuinely needs a 4th hook. Acceptable risk: introducing a new hook with a superseding ADR is cheap if rare; chronic addition is the smell to detect.

## Alternatives Considered

### Alt A: Pure pub/sub via EventBus
- Pro: zero coupling, modifiers are event subscribers like anything else.
- Con: events can't return values to mutate the simulation state mid-step (events are fire-and-forget). Would require modifiers to mutate `entity` directly, which is exactly the implicit shared state problem TD flagged.
- **Rejected** — pretends a problem doesn't exist.

### Alt B: Modifier as full first-class system, registered like PlayerCharacter
- Pro: maximum power.
- Con: massive over-engineering for the 6 modifier shapes. Boilerplate per modifier explodes.
- **Rejected** — wrong scope.

### Alt C: Closed enum of modifier types (low-gravity, giant-ball, ...) hardcoded in Physics
- Pro: no abstraction at all.
- Con: every new modifier modifies Physics. Same problem TD flagged.
- **Rejected**.

### Alt D: A more granular hook set (5-6 hooks)
- Pro: more flexibility.
- Con: more decisions where to put logic, more complexity. Not justified by the modifier catalog we have.
- **Rejected for now**. Reconsider if a modifier post-VS forces it.

## Implementation Notes
- `Physics.registerModifier(m)` validates: at least one of the 3 hook methods must be a function. Throws otherwise.
- Iteration order = registration order. Document this in ModifierSystem GDD.
- Cap MVP/Tier 1 to **1 modifier active per match**. ModifierSystem will enforce this at match-start time. Removes ordering ambiguity.
- Modifier lifetime = match. Register at match start, unregister at match end. Modifier objects are stateless (or only hold their own internal state, not entity references).
- `onCollisionResolve` is called by Collision (not Physics) — but conceptually it's part of the Physics extension surface. Document the cross-system call in `collision.md` and `physics.md`.

## Verification
Re-verify if:
- A modifier post-VS genuinely needs a 4th hook (write superseding ADR).
- Modifier stacking lifts beyond 1 — re-evaluate ordering policy.
- ScoreSystem or MatchState develops its own modifier-like extension surface — extract a generic plugin pattern ADR.
