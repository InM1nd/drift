import type { Status } from "./card";

export type EnemyActionTarget = "player" | "self";

export type EnemyAction =
  | { kind: "damage"; amount: number }
  | { kind: "block"; amount: number }
  | { kind: "applyStatus"; status: Status; stacks: number; target: EnemyActionTarget }
  | { kind: "summon"; enemyId: string }
  /** Атака + статус на игрока одним ходом (Страж-гексапод, docs/04-enemies.md). */
  | { kind: "damageWithStatus"; amount: number; status: Status; stacks: number }
  /**
   * Урон = perCard × число карт, сыгранных игроком в прошлый ход (Страж-гексапод,
   * штраф за "большую руку" из docs/04-enemies.md). Не буквально размер руки:
   * к моменту хода врага рука уже сброшена в endPlayerTurn (docs/02-combat.md,
   * порядок разрешения хода), поэтому единственный сигнал о размахе прошлого
   * хода игрока, доступный на этот момент, — cardsPlayedThisTurn. Он и бьёт
   * по тому же архетипу (Протокол-цепочка, много карт за ход), просто по
   * симптому "сыграно много", а не "осталось на руке много".
   */
  | { kind: "damagePerCardPlayed"; perCard: number };

export type EnemyPattern =
  | { kind: "cycle"; sequence: number[] }
  | { kind: "weighted"; weights: number[] }
  | { kind: "phase"; hpThreshold: number; before: EnemyPattern; after: EnemyPattern };

export interface EnemyData {
  id: string;
  name: string;
  hpRange: [number, number];
  moveset: EnemyAction[];
  pattern: EnemyPattern;
  relicDropId?: string;
}
