import { createActor } from "xstate";
import { describe, expect, it } from "vitest";
import { combatMachine } from "./combatMachine";
import { createInitialCombatState } from "./combatState";
import { STARTER_DECK_IDS } from "../data/cards";

function startActor() {
  const combat = createInitialCombatState(70, STARTER_DECK_IDS, ["hull-turret"], 123);
  const actor = createActor(combatMachine, { input: { combat } });
  actor.start();
  return actor;
}

describe("combatMachine", () => {
  it("играет карту с целью и наносит урон", () => {
    const actor = startActor();
    const before = actor.getSnapshot().context.combat;
    const strikeIndex = before.hand.findIndex((id) => id === "strike");
    expect(strikeIndex).toBeGreaterThanOrEqual(0);
    const enemyHpBefore = before.enemies[0].hp;

    actor.send({ type: "SELECT_CARD", index: strikeIndex });
    actor.send({ type: "TARGET_ENEMY", index: 0 });

    const after = actor.getSnapshot().context.combat;
    expect(after.enemies[0].hp).toBeLessThan(enemyHpBefore);
    expect(after.hand.length).toBe(before.hand.length - 1);
  });

  it("самонацеленная карта (Барьер) играется одним тапом без цели", () => {
    const actor = startActor();
    const before = actor.getSnapshot().context.combat;
    const barrierIndex = before.hand.findIndex((id) => id === "barrier");
    expect(barrierIndex).toBeGreaterThanOrEqual(0);

    actor.send({ type: "SELECT_CARD", index: barrierIndex });

    const after = actor.getSnapshot().context.combat;
    expect(after.player.shield).toBe(5);
    expect(after.hand.length).toBe(before.hand.length - 1);
  });

  it("конец хода запускает ход врага и возвращает к игроку", () => {
    const actor = startActor();
    actor.send({ type: "END_TURN" });
    const state = actor.getSnapshot();
    expect(state.value).toBe("playerTurn");
    expect(state.context.combat.turn).toBe(1);
    expect(state.context.combat.hand.length).toBe(5);
  });

  it("выбор карты, ожидающей цель, не переживает конец хода (регресс: индекс руки залипал на новой карте)", () => {
    const actor = startActor();
    const before = actor.getSnapshot().context.combat;
    const targetedIndex = before.hand.findIndex((id) => id === "strike" || id === "caustic-charge");
    expect(targetedIndex).toBeGreaterThanOrEqual(0);

    actor.send({ type: "SELECT_CARD", index: targetedIndex });
    expect(actor.getSnapshot().context.combat.selectedHandIndex).toBe(targetedIndex);

    actor.send({ type: "END_TURN" });
    expect(actor.getSnapshot().context.combat.selectedHandIndex).toBeNull();
    expect(actor.getSnapshot().context.combat.targetEnemyIndex).toBeNull();
  });

  it("падение HP игрока до 0 переводит в defeat", () => {
    // санитарный дрон бьёт с первого хода (турель на 1-м ходу ставит щит, не атакует)
    const combat = createInitialCombatState(70, STARTER_DECK_IDS, ["sanitation-drone"], 123);
    const actor = createActor(combatMachine, { input: { combat } });
    actor.start();
    actor.send({ type: "DEV_SET_HP", who: "player", hp: 1 });
    actor.send({ type: "END_TURN" });
    expect(actor.getSnapshot().value).toBe("defeat");
  });

  it("падение HP всех врагов до 0 переводит в victory", () => {
    const actor = startActor();
    actor.send({ type: "DEV_SET_HP", who: 0, hp: 1 });
    const before = actor.getSnapshot().context.combat;
    const strikeIndex = before.hand.findIndex((id) => id === "strike");
    actor.send({ type: "SELECT_CARD", index: strikeIndex });
    actor.send({ type: "TARGET_ENEMY", index: 0 });
    expect(actor.getSnapshot().value).toBe("victory");
  });

  it("DEV_RESTART пересоздаёт бой из состояния victory", () => {
    const actor = startActor();
    actor.send({ type: "DEV_SET_HP", who: 0, hp: 1 });
    const before = actor.getSnapshot().context.combat;
    const strikeIndex = before.hand.findIndex((id) => id === "strike");
    actor.send({ type: "SELECT_CARD", index: strikeIndex });
    actor.send({ type: "TARGET_ENEMY", index: 0 });
    expect(actor.getSnapshot().value).toBe("victory");

    actor.send({ type: "DEV_RESTART", seed: 5, enemyId: "sanitation-drone", playerHp: 70 });
    const state = actor.getSnapshot();
    expect(state.value).toBe("playerTurn");
    expect(state.context.combat.enemies[0].enemyId).toBe("sanitation-drone");
    expect(state.context.combat.outcome).toBe("ongoing");
  });
});
