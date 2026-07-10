import type { Status } from "../types";
import type { EnemyData } from "../types";
import { getEnemyById, isEliteOrBoss } from "../data/enemies";
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
  /** Боевой стимулятор (Инъектор): следующий эффект урона от игрока удваивается, затем сбрасывается. */
  doubleNextAttack: boolean;
}

export interface EnemyCombatantState extends CombatantState {
  enemyId: string;
  name: string;
  moveIndex: number;
  /** Разовая заявка "уже призывал подкрепление в этом бою" (Ядро-Страж, docs/04-enemies.md) — не завязана на moveIndex/цикл. */
  summonedOnce?: boolean;
}

export interface CombatState {
  rng: RngState;
  turn: number;
  cardsPlayedThisTurn: number;
  /** Заряд, уплаченный за текущую разыгрываемую карту — читает эффект ref:"energySpent" (Всплеск мощности). */
  lastCardCost: number;
  /** id владеемых Модулей (docs/05-items.md) — влияют на резолвер (Milestone B). */
  modules: string[];
  /** id Инъекторов в инвентаре забега (docs/05-items.md) — расходуются по одному, splice при использовании. */
  injectors: string[];
  /** Уровень угрозы (docs/11-threat-level.md): множитель урона всех вражеских атак по игроку. */
  threatDamageMult: number;
  player: PlayerState;
  enemies: EnemyCombatantState[];
  hand: string[];
  drawPile: string[];
  discardPile: string[];
  exhaustPile: string[];
  activePowerIds: string[];
  selectedHandIndex: number | null;
  /** Выбранный (но ещё не применённый) Инъектор из ряда ниже руки — ждёт цели, если targeted. */
  selectedInjectorIndex: number | null;
  targetEnemyIndex: number | null;
  log: string[];
  outcome: "ongoing" | "victory" | "defeat";
}

const PLAYER_MAX_ENERGY = 3;
const HAND_SIZE = 5;

/**
 * Экспортируется для resolveEffect.ts — тот же способ породить вражеский экземпляр нужен для "summon" (подкрепление Ядра-Стража).
 * hpMult — Уровень угрозы (docs/11-threat-level.md); округление вверх — единственный
 * случай в игре, где округление намеренно в пользу сложности, а не игрока.
 */
export function enemyFromData(data: EnemyData, rng: RngState, hpMult = 1): EnemyCombatantState {
  const [min, max] = data.hpRange;
  const hp = Math.ceil((min + nextInt(rng, max - min + 1)) * hpMult);
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
  /** id Инъекторов в инвентаре забега — см. CombatState.injectors. */
  injectorIds?: string[];
  /** Уровень угрозы (docs/11-threat-level.md) — все по умолчанию 1 (нейтрально, без модификатора). */
  enemyHpMult?: number;
  eliteBossHpMult?: number;
  threatDamageMult?: number;
}

export function createInitialCombatState(
  playerHp: number,
  deckCardIds: string[],
  enemyIds: string[],
  seed: number,
  options: CreateCombatOptions = {},
): CombatState {
  const rng = createRng(seed);
  const {
    playerMaxHp = playerHp,
    modules = [],
    carriedOverdrive = 0,
    injectorIds = [],
    enemyHpMult = 1,
    eliteBossHpMult = 1,
    threatDamageMult = 1,
  } = options;
  const enemies = enemyIds.map((id) =>
    enemyFromData(getEnemyById(id), rng, isEliteOrBoss(id) ? eliteBossHpMult : enemyHpMult),
  );
  const drawPile = shuffle(rng, deckCardIds);

  const state: CombatState = {
    rng,
    turn: 0,
    cardsPlayedThisTurn: 0,
    lastCardCost: 0,
    modules,
    injectors: [...injectorIds],
    threatDamageMult,
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
      doubleNextAttack: false,
    },
    enemies,
    hand: [],
    drawPile,
    discardPile: [],
    exhaustPile: [],
    activePowerIds: [],
    selectedHandIndex: null,
    selectedInjectorIndex: null,
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
