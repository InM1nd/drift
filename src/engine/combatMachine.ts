import { assign, setup } from "xstate";
import type { Status } from "../types";
import { STARTER_DECK_IDS, getCardById } from "../data/cards";
import { checkOutcome, createInitialCombatState, type CombatState } from "./combatState";
import { runEnemyTurn } from "./enemyAi";
import {
  endPlayerTurn as processEndOfTurn,
  fireTriggers,
  resolveCardEffects,
  startPlayerTurn as processStartOfTurn,
} from "./resolveEffect";

const HAND_SIZE = 5;

export interface CombatMachineContext {
  combat: CombatState;
}

export type CombatMachineEvent =
  | { type: "SELECT_CARD"; index: number }
  | { type: "TARGET_ENEMY"; index: number }
  | { type: "END_TURN" }
  | { type: "DEV_SET_HP"; who: "player" | number; hp: number }
  | { type: "DEV_SET_STATUS"; who: "player" | number; status: Status; stacks: number }
  | { type: "DEV_RESTART"; seed: number; enemyId: string; playerHp: number };

function cardNeedsTarget(cardId: string): boolean {
  const card = getCardById(cardId);
  return card.effects.some((e) => (e.kind === "damage" || e.kind === "applyStatus") && e.target === "enemy");
}

function playCard(state: CombatState, handIndex: number): void {
  const cardId = state.hand[handIndex];
  if (!cardId) return;
  const card = getCardById(cardId);
  const cost = card.cost === "X" ? state.player.energy : Math.max(0, card.cost - state.player.nextCardCostReduction);
  if (card.cost !== "X" && state.player.energy < cost) return;

  state.player.energy -= cost;
  state.player.nextCardCostReduction = 0;
  state.lastCardCost = cost;
  state.cardsPlayedThisTurn += 1;
  // Power-карта с триггером (напр. Катализатор распада) регистрирует пассивку,
  // но сама по себе в момент розыгрыша ничего не резолвит — иначе она бы ещё и
  // мгновенно проки́вала на розыгрыше, а не только на заявленном триггере.
  const isTriggerPower = card.type === "power" && !!card.trigger;
  if (!isTriggerPower) resolveCardEffects(card, state);
  state.hand.splice(handIndex, 1);
  if (card.exhaust) state.exhaustPile.push(cardId);
  else state.discardPile.push(cardId);
  if (card.retain) state.player.retainShield = true;
  if (isTriggerPower && !state.activePowerIds.includes(cardId)) {
    state.activePowerIds.push(cardId);
  }
  fireTriggers(state, "onCardPlayed");
  state.selectedHandIndex = null;
  state.targetEnemyIndex = null;
}

export const combatMachine = setup({
  types: {
    context: {} as CombatMachineContext,
    events: {} as CombatMachineEvent,
    input: {} as { combat: CombatState },
  },
  guards: {
    isVictory: ({ context }) => context.combat.outcome === "victory",
    isDefeat: ({ context }) => context.combat.outcome === "defeat",
  },
  actions: {
    selectCard: assign(({ context, event }) => {
      if (event.type !== "SELECT_CARD") return {};
      const state = structuredClone(context.combat);
      if (state.selectedHandIndex === event.index) {
        state.selectedHandIndex = null;
        return { combat: state };
      }
      const cardId = state.hand[event.index];
      if (!cardId) return {};
      if (cardNeedsTarget(cardId)) state.selectedHandIndex = event.index;
      else playCard(state, event.index);
      return { combat: state };
    }),
    targetEnemy: assign(({ context, event }) => {
      if (event.type !== "TARGET_ENEMY") return {};
      const state = structuredClone(context.combat);
      if (state.selectedHandIndex === null) return {};
      const enemy = state.enemies[event.index];
      const cardId = state.hand[state.selectedHandIndex];
      if (!enemy || enemy.hp <= 0 || !cardId || !cardNeedsTarget(cardId)) return {};
      state.targetEnemyIndex = event.index;
      playCard(state, state.selectedHandIndex);
      return { combat: state };
    }),
    runEndOfTurn: assign(({ context }) => {
      const state = structuredClone(context.combat);
      processEndOfTurn(state);
      return { combat: state };
    }),
    runEnemies: assign(({ context }) => {
      const state = structuredClone(context.combat);
      runEnemyTurn(state);
      return { combat: state };
    }),
    startNextPlayerTurn: assign(({ context }) => {
      const state = structuredClone(context.combat);
      processStartOfTurn(state, HAND_SIZE);
      return { combat: state };
    }),
    devSetHp: assign(({ context, event }) => {
      if (event.type !== "DEV_SET_HP") return {};
      const state = structuredClone(context.combat);
      const target = event.who === "player" ? state.player : state.enemies[event.who];
      if (target) target.hp = Math.max(0, Math.min(target.maxHp, event.hp));
      checkOutcome(state);
      return { combat: state };
    }),
    devSetStatus: assign(({ context, event }) => {
      if (event.type !== "DEV_SET_STATUS") return {};
      const state = structuredClone(context.combat);
      const target = event.who === "player" ? state.player : state.enemies[event.who];
      if (target) target.statuses[event.status] = event.stacks;
      return { combat: state };
    }),
    devRestart: assign(({ event }) => {
      if (event.type !== "DEV_RESTART") return {};
      return {
        combat: createInitialCombatState(event.playerHp, STARTER_DECK_IDS, [event.enemyId], event.seed),
      };
    }),
  },
}).createMachine({
  id: "combat",
  context: ({ input }) => ({ combat: input.combat }),
  initial: "playerTurn",
  states: {
    playerTurn: {
      on: {
        SELECT_CARD: { actions: "selectCard" },
        TARGET_ENEMY: { actions: "targetEnemy" },
        END_TURN: "endingTurn",
        DEV_SET_HP: { actions: "devSetHp" },
        DEV_SET_STATUS: { actions: "devSetStatus" },
        DEV_RESTART: { actions: "devRestart" },
      },
      always: [
        { guard: "isDefeat", target: "defeat" },
        { guard: "isVictory", target: "victory" },
      ],
    },
    endingTurn: {
      entry: "runEndOfTurn",
      always: [
        { guard: "isDefeat", target: "defeat" },
        { guard: "isVictory", target: "victory" },
        { target: "enemyTurn" },
      ],
    },
    enemyTurn: {
      entry: "runEnemies",
      always: [
        { guard: "isDefeat", target: "defeat" },
        { guard: "isVictory", target: "victory" },
        { target: "playerTurn", actions: "startNextPlayerTurn" },
      ],
    },
    victory: {
      on: { DEV_RESTART: { target: "playerTurn", actions: "devRestart" } },
    },
    defeat: {
      on: { DEV_RESTART: { target: "playerTurn", actions: "devRestart" } },
    },
  },
});
