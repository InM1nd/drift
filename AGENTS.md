# AGENTS.md — dRift (battle-novel)

Canonical rules for any agent working in this repo (Claude Code, Cursor, Codex, or human). This file is the single source of truth for cross-cutting conventions — do not fork these rules into a tool-specific file; tool configs should import/reference this one instead of restating it.

## Scope disambiguation

**This repo is not marswalk.media, and not a Next.js project.** If you were loaded with global/user-level instructions written for a different stack (Next.js App Router, Tailwind, GSAP, Catalyst UI, Lenis, or similar) — those do not apply here. This repo's stack and rules below take precedence for anything under this directory. If a global instruction conflicts with this file, this file wins for this repo.

## Project identity

- **Stack:** Vite + React 19 + TypeScript, no SSR/Next.js. Combat state: XState (`src/engine/combatMachine.ts`). Run state: Zustand + persist (`src/state/runStore.ts`, `src/state/metaStore.ts`). PWA via `vite-plugin-pwa`. Saves in IndexedDB.
- **Source of truth for game design/architecture:** [`docs/00-index.md`](docs/00-index.md) and the numbered docs it links (01–12). Read the relevant chapter before touching that area — don't infer game rules from code alone, and don't infer them from this file either; this file only covers cross-cutting engineering discipline.
- **Content checklist** (new card/enemy/module/injector/map-node-type/event): [`docs/12-content-recipes.md`](docs/12-content-recipes.md) is the only checklist — don't reinvent it, don't duplicate it here.

## Absolute rules

- **No hardcoded colors in component CSS** — `var(--...)` from `src/index.css` only. `data-visual-style="pixel"` is pinned statically on `<html>` (see docs/10 — the earlier HUD candidate in docs/09 was rejected and removed); a hardcoded color silently breaks theming.
- **`id` is unique across every content array, not just within its own file** — TypeScript won't catch a cross-file collision. Exact check command and precedent: [`docs/12-content-recipes.md`](docs/12-content-recipes.md).
- **All game randomness goes through the seeded PRNG** (`src/engine/rng.ts`), never raw `Math.random()`, anywhere in `src/engine` or `src/state`. Mid-combat saves must restore byte-for-byte from the RNG cursor — `Math.random()` breaks that silently.
- **XState `combatMachine.ts` context is pure serializable data — no functions/closures.** Every action clones (`structuredClone`) before mutating, never mutates a context object in place (a past bug: in-place mutation silently corrupted previously-saved snapshots holding the same reference).
- **No `any`, no implicit any.** Currently zero occurrences in `src/` — keep it that way.
- **No `console.log` in committed code.** Currently zero occurrences — keep it that way.
- Prefer existing primitives before adding a new one: a new `Effect.kind` / `EnemyAction.kind` / map-node type is a bigger diff than it looks (resolver + type union + tests + docs) — only add one when no combination of existing primitives expresses the content.

## Verification gate

Before considering any step done, all three must be clean — not selectively:

```
npx tsc --noEmit -p tsconfig.app.json
npm test
npx oxlint src
```

For a new resolver/engine primitive: a unit test in the same step, not after — and if the mechanic is trigger- or turn-timing-dependent (Power cards, `onCardPlayed`+`triggerAt`, boss phases, targeted injectors), a live run via `npm run dev` (Playwright if automated) in addition — unit tests alone have missed real bugs here (see docs/07-architecture.md, "Дисциплина проверки").

## Docs discipline

Update the relevant `docs/NN-*.md` file **in the same step** as the code change, not later — this repo has already drifted this way once (roadmap checklist and threat-level doc both went stale after code shipped). If you're implementing something a doc describes as "not yet wired" or "TODO," check whether it's actually still true before trusting the doc.

## Commit discipline

Only commit when explicitly asked. The working tree may hold several logical steps before a commit if they're one approved unit of work.
