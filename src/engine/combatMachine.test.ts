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

  it("Power-карта с триггером не резолвит эффект мгновенно при розыгрыше — только на заявленном триггере (регресс)", () => {
    const combat = createInitialCombatState(70, ["decay-catalyst"], ["sanitation-drone"], 1);
    const actor = createActor(combatMachine, { input: { combat } });
    actor.start();
    actor.send({ type: "DEV_SET_STATUS", who: 0, status: "corrosion", stacks: 2 });

    const before = actor.getSnapshot().context.combat;
    const index = before.hand.findIndex((id) => id === "decay-catalyst");
    expect(index).toBeGreaterThanOrEqual(0);

    actor.send({ type: "SELECT_CARD", index });
    const afterPlay = actor.getSnapshot().context.combat;
    expect(afterPlay.enemies[0].statuses.corrosion).toBe(2); // не сработало мгновенно
    expect(afterPlay.activePowerIds).toContain("decay-catalyst");

    actor.send({ type: "END_TURN" }); // тик коррозии (2→1) → ход врага → onTurnStart триггер (1→2)
    const afterTurn = actor.getSnapshot().context.combat;
    expect(afterTurn.enemies[0].statuses.corrosion).toBe(2);
  });

  it("Перегрузка ядра: onCardPlayed + triggerAt срабатывает ровно на 3-й сыгранной карте за ход", () => {
    const combat = createInitialCombatState(
      70,
      ["core-overload", "strike", "strike", "strike", "strike"],
      ["hull-turret"],
      1,
    );
    const actor = createActor(combatMachine, { input: { combat } });
    actor.start();

    const hand = actor.getSnapshot().context.combat.hand;
    const overloadIndex = hand.findIndex((id) => id === "core-overload");
    expect(overloadIndex).toBeGreaterThanOrEqual(0);
    actor.send({ type: "SELECT_CARD", index: overloadIndex }); // 1-я карта — без цели, регистрирует пассивку

    let state = actor.getSnapshot().context.combat;
    expect(state.activePowerIds).toContain("core-overload");
    expect(state.player.energy).toBe(2); // 3 - 1, бонус ещё не сработал

    const strikeIndex1 = state.hand.findIndex((id) => id === "strike");
    actor.send({ type: "SELECT_CARD", index: strikeIndex1 });
    actor.send({ type: "TARGET_ENEMY", index: 0 }); // 2-я карта

    state = actor.getSnapshot().context.combat;
    expect(state.cardsPlayedThisTurn).toBe(2);
    expect(state.player.energy).toBe(1); // всё ещё без бонуса

    const strikeIndex2 = state.hand.findIndex((id) => id === "strike");
    actor.send({ type: "SELECT_CARD", index: strikeIndex2 });
    actor.send({ type: "TARGET_ENEMY", index: 0 }); // 3-я карта — триггер должен сработать

    state = actor.getSnapshot().context.combat;
    expect(state.cardsPlayedThisTurn).toBe(3);
    expect(state.player.energy).toBe(1); // 0 после траты + 1 от триггера
  });

  it("Инъектор (нецелевой) применяется одним тапом и расходуется из инвентаря (docs/05-items.md)", () => {
    const combat = createInitialCombatState(70, STARTER_DECK_IDS, ["hull-turret"], 123, {
      injectorIds: ["shield-injector", "medgel"],
    });
    const actor = createActor(combatMachine, { input: { combat } });
    actor.start();

    actor.send({ type: "SELECT_INJECTOR", index: 0 });

    const after = actor.getSnapshot().context.combat;
    expect(after.player.shield).toBe(8);
    expect(after.injectors).toEqual(["medgel"]);
    expect(after.selectedInjectorIndex).toBeNull();
  });

  it("Перегрузка щитов: card.retain переживает щит через начало следующего хода", () => {
    const combat = createInitialCombatState(70, ["shield-overload"], ["hull-turret"], 1);
    const actor = createActor(combatMachine, { input: { combat } });
    actor.start();

    const index = actor.getSnapshot().context.combat.hand.findIndex((id) => id === "shield-overload");
    actor.send({ type: "SELECT_CARD", index });
    expect(actor.getSnapshot().context.combat.player.shield).toBe(12);

    actor.send({ type: "END_TURN" });
    expect(actor.getSnapshot().context.combat.player.shield).toBe(12); // не спало на начале след. хода
  });
});
