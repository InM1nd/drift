# Completion gate
All must pass before a coding step is done:
1. `npx tsc --noEmit -p tsconfig.app.json`
2. `npm test`
3. `npx oxlint src`

For new engine/resolver primitives, add a unit test in the same step. For trigger/turn-timing mechanics, boss phases, or targeted injectors, also verify a live `npm run dev` flow (automate with Playwright when useful).