import type { EnemyData } from "../types";

/**
 * Phase 1 slice: 3 рядовых врага отсека «Хорда». Паттерны — простые
 * циклы (детерминированные), без взвешенного выбора — RNG в этом
 * срезе нужен только для тасования колоды. Полный ростер — docs/04-enemies.md.
 */
export const ENEMIES: EnemyData[] = [
  {
    id: "sanitation-drone",
    name: "Санитарный дрон",
    hpRange: [12, 15],
    moveset: [
      { kind: "damage", amount: 5 },
      { kind: "damage", amount: 5 },
      { kind: "damage", amount: 8 },
    ],
    pattern: { kind: "cycle", sequence: [0, 1, 2] },
  },
  {
    id: "hull-turret",
    name: "Турель обшивки",
    hpRange: [18, 22],
    moveset: [
      { kind: "block", amount: 6 },
      { kind: "damage", amount: 9 },
    ],
    pattern: { kind: "cycle", sequence: [0, 1] },
  },
  {
    id: "infected-specimen",
    name: "Заражённый образец",
    hpRange: [14, 18],
    moveset: [
      { kind: "applyStatus", status: "corrosion", stacks: 3, target: "player" },
      { kind: "applyStatus", status: "corrosion", stacks: 3, target: "player" },
      { kind: "damage", amount: 6 },
    ],
    pattern: { kind: "cycle", sequence: [0, 1, 2] },
  },
];

/** Элита и босс Акта 1. Страж-гексапод даёт Модуль через runStore (см. resolveCombat), не отсюда. */
export const ELITE_ENEMIES: EnemyData[] = [
  {
    id: "guardian-hexapod",
    name: "Страж-гексапод",
    hpRange: [45, 55],
    moveset: [
      { kind: "damageWithStatus", amount: 8, status: "breach", stacks: 1 },
      { kind: "block", amount: 10 },
      { kind: "damagePerCardPlayed", perCard: 4 },
    ],
    pattern: { kind: "cycle", sequence: [0, 1, 2] },
  },
];

export const BOSS_ENEMIES: EnemyData[] = [
  {
    id: "core-guardian",
    name: 'Ядро-Страж «Корневой процесс: КОРРОЗИЯ»',
    hpRange: [140, 160],
    moveset: [
      { kind: "damage", amount: 10 },
      { kind: "applyStatus", status: "corrosion", stacks: 3, target: "player" },
      { kind: "block", amount: 10 },
      { kind: "damage", amount: 12 },
      { kind: "applyStatus", status: "corrosion", stacks: 3, target: "self" },
      { kind: "applyStatus", status: "corrosion", stacks: 3, target: "player" },
      // "Разовая подмога" (docs/04-enemies.md) — резолвер (resolveEffect.ts)
      // сам гасит повторные заходы в этот индекс цикла после первого призыва.
      { kind: "summon", enemyId: "sanitation-drone" },
    ],
    pattern: {
      kind: "phase",
      hpThreshold: 50,
      before: { kind: "cycle", sequence: [0, 1, 2] },
      after: { kind: "cycle", sequence: [6, 3, 4, 5] },
    },
  },
];

export const ALL_ENEMIES = [...ENEMIES, ...ELITE_ENEMIES, ...BOSS_ENEMIES];

export function getEnemyById(id: string): EnemyData {
  const enemy = ALL_ENEMIES.find((e) => e.id === id);
  if (!enemy) throw new Error(`Unknown enemy id: ${id}`);
  return enemy;
}
