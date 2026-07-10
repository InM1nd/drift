# Conventions
- Component CSS colors must use `var(--...)` tokens defined in `src/index.css`; runtime themes are `data-visual-style="hud"|"pixel"`.
- No `any`, implicit any, or `console.log` in `src/`.
- Engine/state randomness must use seeded PRNG from `src/engine/rng.ts`; never `Math.random()`.
- `combatMachine.ts` context stays pure serializable data. Actions `structuredClone` before mutation; never mutate context in place.
- Prefer existing effect/action/map primitives; a new primitive requires union/resolver/tests/docs.
- Update the relevant numbered design doc in the same step as implementation.
- Do not commit unless explicitly asked.