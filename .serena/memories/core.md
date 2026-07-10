# dRift
- Vite + React game; no Next.js/SSR.
- Game-design/architecture source of truth: `docs/00-index.md` and linked numbered chapters; read the relevant chapter before changing a domain.
- Combat state: `src/engine/combatMachine.ts`; run/meta state: `src/state/runStore.ts`, `src/state/metaStore.ts`; saves use IndexedDB; PWA via vite-plugin-pwa.
- Content additions must follow `docs/12-content-recipes.md`; content IDs are globally unique across arrays.
- Stack/version notes: `mem:tech_stack`.
- Engineering conventions and invariants: `mem:conventions`.
- Common commands: `mem:suggested_commands`; completion gate: `mem:task_completion`.