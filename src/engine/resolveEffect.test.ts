import { describe, expect, it } from "vitest";
import type { CombatantState } from "./combatState";
import { createInitialCombatState } from "./combatState";
import { applyBlockGain, applyDamage, resolveCardEffects, resolveEnemyAction } from "./resolveEffect";

function combatant(overrides: Partial<CombatantState> = {}): CombatantState {
  return { hp: 30, maxHp: 30, shield: 0, retainShield: false, statuses: {}, ...overrides };
}

describe("applyDamage — формула (база + Форсаж) × Пробоина × Помехи", () => {
  it("совпадает с примером из docs/02-combat.md: 8 базовых → 12 → 12 → 18", () => {
    expect(applyDamage(combatant(), combatant(), 8)).toBe(8);
    expect(applyDamage(combatant({ statuses: { overdrive: 4 } }), combatant(), 8)).toBe(12);
    expect(applyDamage(combatant(), combatant({ statuses: { breach: 1 } }), 8)).toBe(12);
    expect(
      applyDamage(combatant({ statuses: { overdrive: 4 } }), combatant({ statuses: { breach: 1 } }), 8),
    ).toBe(18);
  });

  it("Помехи снижают урон на 25%", () => {
    expect(applyDamage(combatant({ statuses: { jamming: 1 } }), combatant(), 8)).toBe(6);
  });

  it("щит поглощает урон раньше HP", () => {
    const target = combatant({ shield: 5, hp: 20 });
    const dealt = applyDamage(combatant(), target, 8);
    expect(dealt).toBe(8);
    expect(target.shield).toBe(0);
    expect(target.hp).toBe(17); // 20 - (8 - 5)
  });
});

describe("applyBlockGain — база + Стабилизация", () => {
  it("добавляет стеки стабилизации к получаемому щиту", () => {
    const target = combatant({ statuses: { stabilization: 2 } });
    expect(applyBlockGain(target, 5)).toBe(7);
    expect(target.shield).toBe(7);
  });
});

describe("динамические значения карт", () => {
  it("Контрудар: урон = текущий щит игрока", () => {
    const state = createInitialCombatState(70, ["counterstrike"], ["hull-turret"], 1);
    state.player.shield = 9;
    state.targetEnemyIndex = 0;
    resolveCardEffects({ id: "counterstrike", name: "Контрудар", cost: 1, type: "attack", tags: [], description: "", effects: [{ kind: "damage", amount: { ref: "shield" }, target: "enemy" }] }, state);
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 9);
  });

  it("Цепная реакция: урон = карт сыграно в этот ход × 3", () => {
    const state = createInitialCombatState(70, ["chain-reaction"], ["hull-turret"], 1);
    state.cardsPlayedThisTurn = 4;
    state.targetEnemyIndex = 0;
    resolveCardEffects(
      { id: "chain-reaction", name: "Цепная реакция", cost: 2, type: "attack", tags: [], description: "", exhaust: true, effects: [{ kind: "damage", amount: { ref: "cardsPlayedThisTurn", mult: 3 }, target: "enemy" }] },
      state,
    );
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 12);
  });

  it("Финал распада: урон = стек Коррозии на цели × 2", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.targetEnemyIndex = 0;
    state.enemies[0].statuses.corrosion = 5;
    resolveCardEffects(
      { id: "decay-finisher", name: "Финал распада", cost: 2, type: "attack", tags: [], description: "", exhaust: true, effects: [{ kind: "damage", amount: { ref: "corrosionOnTarget", mult: 2 }, target: "enemy" }] },
      state,
    );
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 10);
  });
});

describe("resolveEnemyAction — ходы Стража-гексапода (docs/04-enemies.md)", () => {
  it("damageWithStatus: урон и статус на игрока одним ходом", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    resolveEnemyAction({ kind: "damageWithStatus", amount: 8, status: "breach", stacks: 1 }, state.enemies[0], state);
    expect(state.player.hp).toBe(62);
    expect(state.player.statuses.breach).toBe(1);
  });

  it("damagePerCardPlayed: берёт cardsPlayedThisTurn, а не размер руки — рука уже сброшена к ходу врага (docs/02-combat.md)", () => {
    const state = createInitialCombatState(70, ["strike"], ["hull-turret"], 1);
    state.cardsPlayedThisTurn = 3;
    state.hand = [];
    resolveEnemyAction({ kind: "damagePerCardPlayed", perCard: 4 }, state.enemies[0], state);
    expect(state.player.hp).toBe(58);
  });
});
