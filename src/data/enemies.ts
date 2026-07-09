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

export function getEnemyById(id: string): EnemyData {
  const enemy = ENEMIES.find((e) => e.id === id);
  if (!enemy) throw new Error(`Unknown enemy id: ${id}`);
  return enemy;
}
