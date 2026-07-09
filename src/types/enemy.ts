import type { Status } from "./card";

export type EnemyActionTarget = "player" | "self";

export type EnemyAction =
  | { kind: "damage"; amount: number }
  | { kind: "block"; amount: number }
  | { kind: "applyStatus"; status: Status; stacks: number; target: EnemyActionTarget }
  | { kind: "summon"; enemyId: string };

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
