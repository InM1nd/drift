import { describe, expect, it } from "vitest";
import { peekNextMove } from "./enemyAi";
import type { EnemyCombatantState } from "./combatState";

function bossState(hp: number, maxHp: number, moveIndex = 0): EnemyCombatantState {
  return {
    enemyId: "core-guardian",
    name: "Ядро-Страж",
    hp,
    maxHp,
    shield: 0,
    retainShield: false,
    statuses: {},
    moveIndex,
  };
}

describe("peekNextMove — паттерн phase (Ядро-Страж, docs/04-enemies.md)", () => {
  it("выше порога HP использует паттерн before", () => {
    expect(peekNextMove(bossState(155, 155))).toEqual({ kind: "damage", amount: 10 });
  });

  it("на пороге 50% и ниже переключается на паттерн after, первым ходом — призыв подкрепления", () => {
    expect(peekNextMove(bossState(77, 155))).toEqual({ kind: "summon", enemyId: "sanitation-drone" });
    expect(peekNextMove(bossState(70, 155))).toEqual({ kind: "summon", enemyId: "sanitation-drone" });
  });

  it("после призыва цикл фазы 2 идёт: урон → Коррозия на себя → Коррозия на игрока", () => {
    expect(peekNextMove(bossState(70, 155, 1))).toEqual({ kind: "damage", amount: 12 });
    expect(peekNextMove(bossState(70, 155, 2))).toEqual({
      kind: "applyStatus",
      status: "corrosion",
      stacks: 3,
      target: "self",
    });
    expect(peekNextMove(bossState(70, 155, 3))).toEqual({
      kind: "applyStatus",
      status: "corrosion",
      stacks: 3,
      target: "player",
    });
  });
});
