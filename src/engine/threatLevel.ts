/**
 * Уровень угрозы (docs/11-threat-level.md) — Ascension-по духу модификатор
 * сложности, кумулятивный по уровням. Числа здесь — черновая развёртка до
 * плейтеста Фазы 7, не финальный баланс.
 */
export const MAX_THREAT_LEVEL = 5;

export interface ThreatModifiers {
  /** Множитель HP рядовых врагов (Отсек). */
  enemyHpMult: number;
  /** Множитель HP элиты и босса. */
  eliteBossHpMult: number;
  /** Множитель урона, наносимого любым врагом игроку. */
  enemyDamageMult: number;
  /** Прибавка к стартовым кредитам (отрицательная на высоких уровнях). */
  startingCreditsDelta: number;
  /** Шанс дропа Инъектора за победу, % (см. lootRolls.ts). */
  injectorDropChancePct: number;
}

const BASE_INJECTOR_DROP_CHANCE_PCT = 50;

const TIERS: ThreatModifiers[] = [
  { enemyHpMult: 1, eliteBossHpMult: 1, enemyDamageMult: 1, startingCreditsDelta: 0, injectorDropChancePct: BASE_INJECTOR_DROP_CHANCE_PCT },
  { enemyHpMult: 1.15, eliteBossHpMult: 1, enemyDamageMult: 1, startingCreditsDelta: 0, injectorDropChancePct: BASE_INJECTOR_DROP_CHANCE_PCT },
  { enemyHpMult: 1.15, eliteBossHpMult: 1.15, enemyDamageMult: 1, startingCreditsDelta: 0, injectorDropChancePct: BASE_INJECTOR_DROP_CHANCE_PCT },
  { enemyHpMult: 1.15, eliteBossHpMult: 1.15, enemyDamageMult: 1.15, startingCreditsDelta: 0, injectorDropChancePct: BASE_INJECTOR_DROP_CHANCE_PCT },
  { enemyHpMult: 1.15, eliteBossHpMult: 1.15, enemyDamageMult: 1.15, startingCreditsDelta: -20, injectorDropChancePct: BASE_INJECTOR_DROP_CHANCE_PCT },
  { enemyHpMult: 1.15, eliteBossHpMult: 1.15, enemyDamageMult: 1.15, startingCreditsDelta: -20, injectorDropChancePct: 25 },
];

/** level ожидается в [0, MAX_THREAT_LEVEL] — вне диапазона зажимается. */
export function getThreatModifiers(level: number): ThreatModifiers {
  const clamped = Math.max(0, Math.min(MAX_THREAT_LEVEL, Math.round(level)));
  return TIERS[clamped];
}
