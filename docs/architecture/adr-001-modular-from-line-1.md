# ADR-001: Modular ES modules from line 1 (no single-file phase)

## Status
Accepted

## Date
2026-05-11

## Last Verified
2026-05-11

## Decision Makers
Technical Director (via TD-SYSTEM-BOUNDARY gate), user (project owner).

## Summary
Tier 0 will be authored as native ES modules across the directory layout in `architecture.md` § 2 from the very first commit. The previously discussed "single-file `index.html` first, refactor later" path is rejected.

## Engine Compatibility

| Field | Value |
|---|---|
| Engine | None — Vanilla JS + Canvas 2D web |
| Domain | Core (project structure) |
| Knowledge Risk | LOW |
| References Consulted | TD-SYSTEM-BOUNDARY agent verdict (logged in `design/gdd/systems-index.md`) |
| Post-Cutoff APIs Used | None — `<script type="module">` is pre-2018 baseline |
| Verification Required | None |

## ADR Dependencies

| Field | Value |
|---|---|
| Depends On | None |
| Enables | ADR-002 (Drawable contract — needs file-per-system to avoid circular imports), ADR-003 (Physics plugin API — same) |
| Blocks | All implementation |
| Ordering Note | This is the very first decision — must be Accepted before any code commit. |

## Context

### Problem Statement
The user is a first-time game dev who wants Tier 0 playable in one sitting (4–8h). The original instinct was: "start single-file `index.html` with everything inline, refactor to modules in Tier 1 once feel is validated." The argument: less ceremony = faster iteration today.

### Current State
No code exists yet. The systems-index proposes 14 systems for Tier 0 spread across 5 conceptual layers. ES modules are universally supported in target browsers (Chrome/Firefox/Safari last 2 versions).

## Decision
Author each system in its own file under `src/{engine,game,render,ui,tools}/` from the very first commit, using native ES module imports. Wire everything in `src/main.js`. The HTML file loads exactly one script: `<script type="module" src="src/main.js"></script>`.

## Consequences

### Positive
- **Zero refactor cost mid-project.** A 14-system Tier 0 in a single file = ~800 lines of tangled globals. Refactoring that to modules takes longer than the original sitting it tried to save.
- **Dependency graph from systems-index becomes visible at the file level.** A first-time dev benefits hugely from "this file imports this and that file" being literally what the documentation says.
- **No build step** still holds — ES modules are loaded by the browser natively.
- **Tooling works out of the box** — IDEs autocomplete, jump-to-definition, linting all rely on imports.
- **Easier debugging** — stack traces name files, not "anonymous function in 800-line script".
- **Tier 0 → Tier 1 is purely additive** (per architecture.md §8) — no file renames, no folder restructure.

### Negative
- **Cannot run from `file://` in Chrome with relative imports** without a CORS workaround. Chrome blocks ES module imports from `file://` as of 2020. Mitigation: use any static server (`python -m http.server`, `npx serve`, VS Code Live Server). Document in README. Firefox is more lenient but still flags warnings. **This is the one real cost of this decision.**
- **First-time dev unfamiliar with `import`/`export` syntax** has a small learning bump. Mitigation: examples in every GDD; `main.js` is fully spelled out in architecture.md §3.
- **More files to navigate.** Acceptable — directory tree is the index.

### Neutral
- **Performance impact of multiple small files vs one big file:** negligible in dev (HTTP/2 multiplexes); negligible in prod (no users yet). Future bundling possible if shipped on slow CDN.

## Alternatives Considered

### Alt A: Single-file `index.html` with everything inline
- Pro: zero ceremony, opens directly in browser via `file://`.
- Con: forces refactor mid-project (high cost), no IDE support, no incremental file-level review possible.
- **Rejected** because: the cost-saving is illusory — refactor takes longer than the typing saved.

### Alt B: Mix — foundation/core in modules, feature/presentation inline in `main.js`
- Pro: keeps the "fast iteration" parts in one file.
- Con: arbitrary boundary; same refactor cost when feature code grows past 200 lines.
- **Rejected** because: the boundary doesn't save real complexity, and creates an inconsistent codebase.

### Alt C: Use a bundler (Vite, esbuild) from the start
- Pro: eliminates `file://` problem; HMR for fast iteration.
- Con: violates `.claude/docs/technical-preferences.md` Forbidden Patterns (no build steps in MVP). Adds dependency that first-time dev must learn.
- **Rejected** for MVP. Reconsider for Vertical Slice if HMR becomes valuable.

## Implementation Notes
- Static server: README documents `python3 -m http.server 8000` as the standard local dev command. No bundler.
- All imports relative with `.js` extension (`import { tuning } from './tuning.js';`) — required by browser native module loader.
- No transpilation — target ES2022 directly. No TypeScript in MVP (separate decision; ADR if reconsidered).
- Bootstrap sequence is the strict order documented in architecture.md §3.

## Verification
This ADR is verified correct as of 2026-05-11. Re-verify if:
- The project decides to bundle (would require a new ADR superseding this).
- Browser support for `<script type="module">` regresses (extremely unlikely).
- A first-time dev playtest reports import/export friction blocking progress (consider Alt C).
