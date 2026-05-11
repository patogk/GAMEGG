# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 48 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

- **Engine**: None (custom — Vanilla JS + HTML5 Canvas 2D)
- **Language**: JavaScript (ES2022+, native ES modules)
- **Runtime**: Modern browsers (Chrome / Firefox / Safari, last 2 versions)
- **Version Control**: Git with trunk-based development
- **Build System**: None — `index.html` + `src/*.js` served as-is (works from `file://` or any static server)
- **Asset Pipeline**: None in MVP — primitives drawn in code (Canvas 2D); sprite sheets optional post-vertical-slice
- **Audio**: Web Audio API (lazy-init `AudioContext` on first user input)
- **Storage**: `localStorage` (settings, unlocks, best scores)
- **Tuning**: `tuning.js` magic numbers + dat.gui debug overlay (toggle ` ` ` ` `), persist to localStorage

> **Note**: This project uses a custom web stack — the CCGS engine-specialist
> agents (godot-*, unity-*, unreal-*) do NOT apply. Code review and architecture
> decisions are routed to general specialists: `gameplay-programmer`,
> `engine-programmer`, `ui-programmer`, `tools-programmer`. UI/UX uses
> `ui-programmer` for HTML/Canvas surfaces.

## Project Structure

@.claude/docs/directory-structure.md

## Engine Version Reference

@docs/engine-reference/godot/VERSION.md

## Technical Preferences

@.claude/docs/technical-preferences.md

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/start` to begin the guided onboarding flow.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

@.claude/docs/context-management.md
