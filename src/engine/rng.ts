/**
 * Сидированный PRNG (mulberry32). Состояние — одно 32-битное число,
 * поэтому курсор сериализуется вместе с остальным снапшотом боя
 * (см. "Детерминизм и сохранение" в docs/07-architecture.md).
 */
export interface RngState {
  seed: number;
}

export function createRng(seed: number): RngState {
  return { seed: seed >>> 0 };
}

/** Возвращает число в [0, 1) и мутирует state.seed (курсор) на месте. */
export function nextFloat(state: RngState): number {
  state.seed |= 0;
  state.seed = (state.seed + 0x6d2b79f5) | 0;
  let t = state.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function nextInt(state: RngState, maxExclusive: number): number {
  return Math.floor(nextFloat(state) * maxExclusive);
}

/** Fisher–Yates на сидированном RNG — детерминированное тасование колоды. */
export function shuffle<T>(state: RngState, items: T[]): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = nextInt(state, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
