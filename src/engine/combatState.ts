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

export function createInitialCombatState(
  playerHp: number,
  deckCardIds: string[],
  enemyIds: string[],
  seed: number,
): CombatState {
  const rng = createRng(seed);
  const enemies = enemyIds.map((id) => enemyFromData(getEnemyById(id), rng));
  const drawPile = shuffle(rng, deckCardIds);

  const state: CombatState = {
    rng,
    turn: 0,
    cardsPlayedThisTurn: 0,
    player: {
      hp: playerHp,
      maxHp: playerHp,
      shield: 0,
      retainShield: false,
      statuses: {},
      energy: PLAYER_MAX_ENERGY,
      maxEnergy: PLAYER_MAX_ENERGY,
      nextCardCostReduction: 0,
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
