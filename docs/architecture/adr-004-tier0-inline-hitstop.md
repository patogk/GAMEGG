# ADR-004: Tier 0 inline hitstop in main.js (defer JuiceController)

## Status
Accepted

## Date
2026-05-11

## Last Verified
2026-05-11

## Decision Makers
Technical Director (TD-SYSTEM-BOUNDARY concern #5: Tier 0 cut), user.

## Summary
For Tier 0 (today's prototype), the hitstop on goal is wired inline in `main.js` as a one-liner subscriber to `'goal-scored'`. JuiceController is cut from Tier 0 and deferred to Tier 1 (where it owns hitstop + slow-mo + screen shake as a real system).

## Engine Compatibility

| Field | Value |
|---|---|
| Engine | None — Vanilla JS + Canvas 2D web |
| Domain | Core (loop control) |
| Knowledge Risk | LOW |
| References Consulted | TD-SYSTEM-BOUNDARY verdict, PR-SCOPE verdict, `design/gdd/game-loop.md`, `design/gdd/systems-index.md` |
| Post-Cutoff APIs Used | None |
| Verification Required | None |

## ADR Dependencies

| Field | Value |
|---|---|
| Depends On | ADR-001 |
| Enables | Tier 0 prototype shipping in 4-8h |
| Blocks | None |
| Ordering Note | When Tier 1 begins, JuiceController will be authored and the inline subscriber in main.js removed. Mark this ADR Superseded at that point. |

## Context

### Problem Statement
Tier 0 hypothesis is "is cabezazo + gol fun?". TD flagged that the original Tier 0 system list (16 systems including JuiceController) is too ambitious for one 4-8h sitting and that JuiceController is not on the critical path for the hypothesis. Without hitstop, goals feel flat — but flat-feeling goals still validate the physics hypothesis (the question Tier 0 actually asks).

### Current State
Game-loop GDD specifies `pulseHitstop(ms)` as a public API on GameLoop. Physics + Collision + EventBus all needed for Tier 0. JuiceController would add a thin event-subscriber layer that calls into GameLoop. The "Tier 0 minimal" version of JuiceController IS one line of glue code.

## Decision
In `src/main.js`, after starting the loop, wire:

```js
bus.on('goal-scored', () => loop.pulseHitstop(tuning.loop.tier0HitstopMs));
```

That is the entire Tier 0 hitstop implementation. No `juice.js` file, no JuiceController class, no event-fanout layer.

In Tier 1 (week 1), author `src/game/juice.js` with the full JuiceController. It will:
1. Subscribe to `'goal-scored'`, `'special-fired'`, `'ball-hit-head-hard'`.
2. Call `loop.pulseHitstop(...)` for short freezes, `loop.setTimeScale(0.15, 600)` for slow-mo, and feed screen-shake state to RenderContext.
3. The inline subscriber in main.js is **deleted** when JuiceController takes over.

## Consequences

### Positive
- **One-line implementation.** Zero new files, zero new abstractions for Tier 0.
- **Tier 0 critical path drops from 16 to 14 systems** (per TD recommendation), realistic for a 4-8h sitting.
- **Hypothesis test is preserved:** the Tier 0 question is "does the cabezazo physics + goal feel good?" — flat goals (no slow-mo, no shake) still answer this. If physics is bad, no juice saves it; if physics is good, juice will compound it later.
- **Tier 1 JuiceController is purely additive** — main.js loses one line, gains an `import` and `new JuiceController(...)`. No refactor of any other system.

### Negative
- **Tier 0 goals will feel flat** — only hitstop, no slow-mo, no shake, no audio cue, no flash. This is a deliberate, time-limited cost. Document in playtest report (`/playtest-report` after Tier 0): "feel test is hypothetical extrapolation; juice is layered in Tier 1."
- **Slight regression risk during transition:** when Tier 1 swaps in JuiceController, the developer must remember to delete the inline subscriber. Mitigation: this ADR's Ordering Note flags it; superseding ADR (when JuiceController lands) confirms removal.
- **One-line wiring in main.js is "code in the wrong layer"** — main.js is supposed to be bootstrap, not behavior. Acceptable as a documented temporary cut.

### Neutral
- **`tuning.loop.tier0HitstopMs` exists in tuning.js** — easy to find and rip out when superseded.

## Alternatives Considered

### Alt A: Author JuiceController for Tier 0 with only hitstop, expand in Tier 1
- Pro: clean architecture from line 1.
- Con: file + class + import + GDD = ceremony for a 1-line behavior. TD's point is precisely that JuiceController doesn't earn its keep until it has slow-mo + shake + audio routing.
- **Rejected** — premature abstraction.

### Alt B: Skip hitstop entirely in Tier 0
- Pro: fewest moving parts.
- Con: any feedback at all on goal helps gauge whether the loop is fun. 1 line for hitstop is too cheap to skip.
- **Rejected** — marginal cost, real benefit.

### Alt C: Inline more Tier 1 features into main.js (slow-mo, shake)
- Pro: Tier 0 feels closer to final.
- Con: each adds real complexity — slow-mo needs setTimeScale + ramp-out timing, shake needs RenderContext state. Defeats the cut.
- **Rejected** — that's exactly what TD said NOT to do.

## Implementation Notes
- The inline subscriber goes at the END of `main.js` (post-`loop.start(...)`), in a clearly labelled block:
  ```js
  // ───── Tier 0 inline hitstop (per ADR-004 — superseded by JuiceController in Tier 1)
  bus.on('goal-scored', () => loop.pulseHitstop(tuning.loop.tier0HitstopMs));
  ```
- `tuning.loop.tier0HitstopMs` defaults to 150 (per game-loop.md tuning knobs).
- When superseded: this ADR's Status changes to `Superseded by ADR-NNN (JuiceController)`. The new ADR documents the contract JuiceController exposes.

## Verification
Re-verify when JuiceController is implemented (Tier 1 week 1). The inline subscriber in main.js MUST be removed when JuiceController takes over `'goal-scored'` subscription, or a double-hitstop will trigger.
