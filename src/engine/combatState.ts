import type { Status } from "../types";
import type { EnemyData } from "../types";
import { getEnemyById } from "../data/enemies";
import { createRng, nextInt, shuffle, type RngState } from "./rng";

export type StatusStacks = Partial<Record<Status, number>>;

export interface CombatantState {
  hp: number;
  maxHp: number;
  shield: number;
  retainShield: boolean;
  statuses: StatusStacks;
}

export interface PlayerState extends CombatantState {
  energy: number;
  maxEnergy: number;
  nextCardCostReduction: number;
}

export interface EnemyCombatantState extends CombatantState {
  enemyId: string;
  name: string;
  moveIndex: number;
}

export interface CombatState {
  rng: RngState;
  turn: number;
  cardsPlayedThisTurn: number;
  /** Заряд, уплаченный за текущую разыгрываемую карту — читает эффект ref:"energySpent" (Всплеск мощности). */
  lastCardCost: number;
  /** id владеемых Модулей (docs/05-items.md) — влияют на резолвер (Milestone B). */
  modules: string[];
  player: PlayerState;
  enemies: EnemyCombatantState[];
  hand: string[];
  drawPile: string[];
  discardPile: string[];
  exhaustPile: string[];
  activePowerIds: string[];
  selectedHandIndex: number | null;
  targetEnemyIndex: number | null;
  log: string[];
  outcome: "ongoing" | "victory" | "defeat";
}

const PLAYER_MAX_ENERGY = 3;
const HAND_SIZE = 5;

function enemyFromData(data: EnemyData, rng: RngState): EnemyCombatantState {
  const [min, max] = data.hpRange;
  const hp = min + nextInt(rng, max - min + 1);
  return {
    enemyId: data.id,
    name: data.name,
    hp,
    maxHp: hp,
    shield: 0,
    retainShield: false,
    statuses: {},
    moveIndex: 0,
  };
}

export interface CreateCombatOptions {
  /** HP переносится между боями (docs/02-combat.md), максимум — нет: по умолчанию равен текущему HP. */
  playerMaxHp?: number;
  /** id владеемых Модулей — см. CombatState.modules. */
  modules?: string[];
  /** Форсаж, перенесённый из прошлого боя этого захода (Модуль "Боевой рекордер"). */
  carriedOverdrive?: number;
}

export function createInitialCombatState(
  playerHp: number,
  deckCardIds: string[],
  enemyIds: string[],
  seed: number,
  options: CreateCombatOptions = {},
): CombatState {
  const rng = createRng(seed);
  const enemies = enemyIds.map((id) => enemyFromData(getEnemyById(id), rng));
  const drawPile = shuffle(rng, deckCardIds);
  const { playerMaxHp = playerHp, modules = [], carriedOverdrive = 0 } = options;

  const state: CombatState = {
    rng,
    turn: 0,
    cardsPlayedThisTurn: 0,
    lastCardCost: 0,
    modules,
    player: {
      hp: playerHp,
      maxHp: playerMaxHp,
      shield: 0,
      retainShield: false,
      statuses: carriedOverdrive > 0 ? { overdrive: carriedOverdrive } : {},
      energy: PLAYER_MAX_ENERGY,
      maxEnergy: PLAYER_MAX_ENERGY,
      // Взломанный чип приоритета (Модуль) — тот же чек, что и в startPlayerTurn
      // (resolveEffect.ts): первый ход боя строится напрямую здесь, минуя
      // startPlayerTurn, иначе скидка на первую карту не работала бы в ходу 1.
      nextCardCostReduction: modules.includes("priority-chip") ? 1 : 0,
    },
    enemies,
    hand: [],
    drawPile,
    discardPile: [],
    exhaustPile: [],
    activePowerIds: [],
    selectedHandIndex: null,
    targetEnemyIndex: null,
    log: [],
    outcome: "ongoing",
  };

  drawCards(state, HAND_SIZE);
  return state;
}

export function pushLog(state: CombatState, message: string): void {
  state.log = [...state.log, message];
}

export function drawCards(state: CombatState, count: number): void {
  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) return;
      state.drawPile = shuffle(state.rng, state.discardPile);
      state.discardPile = [];
      pushLog(state, "Сброс перетасован в колоду добора.");
    }
    const cardId = state.drawPile.pop();
    if (cardId) state.hand.push(cardId);
  }
}

export function checkOutcome(state: CombatState): void {
  if (state.player.hp <= 0) {
    state.outcome = "defeat";
    return;
  }
  if (state.enemies.every((e) => e.hp <= 0)) {
    state.outcome = "victory";
  }
}
