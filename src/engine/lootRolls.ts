import { nextInt, type RngState } from "./rng";
import { INJECTORS } from "../data/injectors";

// docs/05-items.md: Инъекторы "дропаются с боёв" — не гарантия за каждый бой
// (иначе 3 слота забиваются за первые же 2-3 боя из 6-8 в акте и дроп после
// этого становится бесполезен), 50% — первое разумное приближение до плейтеста.
const INJECTOR_DROP_CHANCE_PCT = 50;

/**
 * Случайный Инъектор за победу — null, если инвентарь полон или не повезло.
 * dropChancePct — переопределяется Уровнем угрозы (docs/11-threat-level.md), по умолчанию база выше.
 */
export function rollInjectorDrop(
  rng: RngState,
  currentCount: number,
  maxSlots: number,
  dropChancePct: number = INJECTOR_DROP_CHANCE_PCT,
): string | null {
  if (currentCount >= maxSlots) return null;
  if (nextInt(rng, 100) >= dropChancePct) return null;
  return INJECTORS[nextInt(rng, INJECTORS.length)].id;
}
