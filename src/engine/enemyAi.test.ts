import { describe, expect, it } from "vitest";
import { peekNextMove } from "./enemyAi";
import type { EnemyCombatantState } from "./combatState";

function bossState(hp: number, maxHp: number): EnemyCombatantState {
  return {
    enemyId: "core-guardian",
    name: "Ядро-Страж",
    hp,
    maxHp,
    shield: 0,
    retainShield: false,
    statuses: {},
    moveIndex: 0,
  };
}

describe("peekNextMove — паттерн phase (Ядро-Страж, docs/04-enemies.md)", () => {
  it("выше порога HP использует паттерн before", () => {
    expect(peekNextMove(bossState(155, 155))).toEqual({ kind: "damage", amount: 10 });
  });

  it("на пороге 50% и ниже переключается на паттерн after", () => {
    expect(peekNextMove(bossState(77, 155))).toEqual({ kind: "damage", amount: 12 });
    expect(peekNextMove(bossState(70, 155))).toEqual({ kind: "damage", amount: 12 });
  });
});
