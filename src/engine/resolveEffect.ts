import type { Amount, CardData, Effect, Status } from "../types";
import type { EnemyAction } from "../types";
import { getCardById } from "../data/cards";
import type { CombatantState, CombatState, EnemyCombatantState } from "./combatState";
import { checkOutcome, drawCards, pushLog } from "./combatState";

const TEMPORARY_STATUSES: Status[] = ["overdrive", "stabilization", "jamming", "breach"];

const STATUS_LABELS: Record<Status, string> = {
  corrosion: "Коррозия",
  overdrive: "Форсаж",
  stabilization: "Стабилизация",
  jamming: "Помехи",
  breach: "Пробоина",
};

function getTargetEnemy(state: CombatState): EnemyCombatantState {
  const idx = state.targetEnemyIndex;
  const enemy = idx !== null ? state.enemies[idx] : undefined;
  if (!enemy) throw new Error("Нет выбранной цели среди врагов");
  return enemy;
}

function computeAmount(amount: Amount, state: CombatState): number {
  if (typeof amount === "number") return amount;
  let base: number;
  switch (amount.ref) {
    case "shield":
      base = state.player.shield;
      break;
    case "corrosionOnTarget":
      base = getTargetEnemy(state).statuses.corrosion ?? 0;
      break;
    case "cardsPlayedThisTurn":
      base = state.cardsPlayedThisTurn;
      break;
    case "energySpent":
      base = 0; // не задействовано картами Фазы 1
      break;
  }
  return Math.floor(base * (amount.mult ?? 1));
}

/** База + Форсаж атакующего, ×1.5 если на цели Пробоина, ×0.75 если у атакующего Помехи. */
export function computeDamage(attacker: CombatantState, target: CombatantState, base: number): number {
  const overdrive = attacker.statuses.overdrive ?? 0;
  const jamming = attacker.statuses.jamming ?? 0;
  const breach = target.statuses.breach ?? 0;
  let raw = base + overdrive;
  if (breach > 0) raw *= 1.5;
  if (jamming > 0) raw *= 0.75;
  return Math.max(0, Math.floor(raw));
}

/** Считает итоговый урон (см. computeDamage) и списывает его с цели через Щит. */
export function applyDamage(attacker: CombatantState, target: CombatantState, base: number): number {
  const final = computeDamage(attacker, target, base);
  const shieldAbsorbed = Math.min(target.shield, final);
  target.shield -= shieldAbsorbed;
  target.hp = Math.max(0, target.hp - (final - shieldAbsorbed));
  return final;
}

/** База + Стабилизация получателя. */
export function applyBlockGain(target: CombatantState, base: number): number {
  const stabilization = target.statuses.stabilization ?? 0;
  const gain = base + stabilization;
  target.shield += gain;
  return gain;
}

function addStatus(target: CombatantState, status: Status, stacks: number): void {
  target.statuses[status] = (target.statuses[status] ?? 0) + stacks;
}

function aliveEnemies(state: CombatState): EnemyCombatantState[] {
  return state.enemies.filter((e) => e.hp > 0);
}

export function resolveCardEffects(card: CardData, state: CombatState): void {
  for (const effect of card.effects) {
    applyEffect(effect, state, state.player, card.name);
  }
}

export function resolveEnemyAction(action: EnemyAction, enemy: EnemyCombatantState, state: CombatState): void {
  switch (action.kind) {
    case "damage": {
      const dealt = applyDamage(enemy, state.player, action.amount);
      pushLog(state, `${enemy.name}: ${dealt} урона по Ныряльщику (HP ${state.player.hp}/${state.player.maxHp}).`);
      checkOutcome(state);
      break;
    }
    case "block": {
      const gained = applyBlockGain(enemy, action.amount);
      pushLog(state, `${enemy.name}: +${gained} щита (Щит ${enemy.shield}).`);
      break;
    }
    case "applyStatus": {
      const target = action.target === "player" ? state.player : enemy;
      addStatus(target, action.status, action.stacks);
      pushLog(
        state,
        `${enemy.name}: ${STATUS_LABELS[action.status]} +${action.stacks} на ${action.target === "player" ? "Ныряльщика" : enemy.name}.`,
      );
      break;
    }
    case "summon":
      pushLog(state, `${enemy.name}: вызов подкрепления (не реализовано в Фазе 1).`);
      break;
    case "damageWithStatus": {
      const dealt = applyDamage(enemy, state.player, action.amount);
      addStatus(state.player, action.status, action.stacks);
      pushLog(
        state,
        `${enemy.name}: ${dealt} урона по Ныряльщику + ${STATUS_LABELS[action.status]} +${action.stacks} (HP ${state.player.hp}/${state.player.maxHp}).`,
      );
      checkOutcome(state);
      break;
    }
    case "damagePerCardPlayed": {
      const base = action.perCard * state.cardsPlayedThisTurn;
      const dealt = applyDamage(enemy, state.player, base);
      pushLog(
        state,
        `${enemy.name}: ${dealt} урона по Ныряльщику за ${state.cardsPlayedThisTurn} карт(ы), сыгранных в прошлый ход (HP ${state.player.hp}/${state.player.maxHp}).`,
      );
      checkOutcome(state);
      break;
    }
  }
}

function applyEffect(effect: Effect, state: CombatState, attacker: CombatantState, sourceName: string): void {
  switch (effect.kind) {
    case "damage": {
      const amount = computeAmount(effect.amount, state);
      const targets = effect.target === "allEnemies" ? aliveEnemies(state) : [getTargetEnemy(state)];
      for (const enemy of targets) {
        const dealt = applyDamage(attacker, enemy, amount);
        pushLog(state, `${sourceName}: ${dealt} урона по ${enemy.name} (HP ${enemy.hp}/${enemy.maxHp}).`);
      }
      checkOutcome(state);
      break;
    }
    case "block": {
      const amount = computeAmount(effect.amount, state);
      const gained = applyBlockGain(state.player, amount);
      pushLog(state, `${sourceName}: +${gained} щита (Щит ${state.player.shield}).`);
      break;
    }
    case "heal": {
      const amount = computeAmount(effect.amount, state);
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + amount);
      pushLog(state, `${sourceName}: +${amount} HP (HP ${state.player.hp}/${state.player.maxHp}).`);
      break;
    }
    case "gainEnergy": {
      const amount = computeAmount(effect.amount, state);
      state.player.energy += amount;
      pushLog(state, `${sourceName}: +${amount} Заряда (Заряд ${state.player.energy}).`);
      break;
    }
    case "applyStatus": {
      const stacks = computeAmount(effect.stacks, state);
      if (effect.target === "allEnemies") {
        const targets = aliveEnemies(state).filter(
          (e) => !effect.onlyIfPresent || (e.statuses[effect.status] ?? 0) > 0,
        );
        for (const enemy of targets) addStatus(enemy, effect.status, stacks);
        pushLog(state, `${sourceName}: ${STATUS_LABELS[effect.status]} +${stacks} врагам с этим статусом (${targets.length}).`);
      } else if (effect.target === "self") {
        addStatus(state.player, effect.status, stacks);
        pushLog(state, `${sourceName}: ${STATUS_LABELS[effect.status]} +${stacks} себе.`);
      } else {
        const enemy = getTargetEnemy(state);
        addStatus(enemy, effect.status, stacks);
        pushLog(state, `${sourceName}: ${STATUS_LABELS[effect.status]} +${stacks} на ${enemy.name}.`);
      }
      break;
    }
    case "draw": {
      const count = computeAmount(effect.count, state);
      drawCards(state, count);
      pushLog(state, `${sourceName}: добрано ${count} карт(ы).`);
      break;
    }
    case "reduceNextCardCost": {
      state.player.nextCardCostReduction += effect.amount;
      pushLog(state, `${sourceName}: следующая карта дешевле на ${effect.amount}.`);
      break;
    }
  }
}

/** Триггеры активных Power-карт для заданной точки (см. docs/02-combat.md). */
export function fireTriggers(state: CombatState, point: "onTurnStart" | "onTurnEnd"): void {
  for (const cardId of state.activePowerIds) {
    const card = getCardById(cardId);
    if (card.trigger === point) resolveCardEffects(card, state);
  }
}

/**
 * Явный, строго упорядоченный переход конца хода игрока (docs/02-combat.md):
 * 1) тик Коррозии — урон ДО уменьшения стека; 2) спад временных статусов;
 * 3) триггеры onTurnEnd. Порядок специально вынесен в одну функцию, а не
 * разбросан по колбэкам — здесь живут все ошибки очерёдности.
 */
export function endPlayerTurn(state: CombatState): void {
  const all: CombatantState[] = [state.player, ...state.enemies.filter((e) => e.hp > 0)];
  for (const c of all) {
    const stacks = c.statuses.corrosion ?? 0;
    if (stacks > 0) {
      c.hp = Math.max(0, c.hp - stacks);
      c.statuses.corrosion = stacks - 1;
      const label = c === state.player ? "Ныряльщик" : (c as EnemyCombatantState).name;
      pushLog(state, `Коррозия: ${stacks} урона по ${label} (HP ${c.hp}).`);
    }
  }
  checkOutcome(state);

  for (const c of all) {
    for (const status of TEMPORARY_STATUSES) {
      const stacks = c.statuses[status];
      if (stacks && stacks > 0) {
        c.statuses[status] = stacks - 1 > 0 ? stacks - 1 : undefined;
      }
    }
  }

  fireTriggers(state, "onTurnEnd");

  state.discardPile.push(...state.hand);
  state.hand = [];
  // Индексы выбора карты/цели теряют смысл вместе со старой рукой — иначе
  // "выбор" молча прилипнет к случайной карте в новой руке следующего хода.
  state.selectedHandIndex = null;
  state.targetEnemyIndex = null;
}

/** Начало хода игрока: спад щита (если не Retain), триггеры onTurnStart, добор. */
export function startPlayerTurn(state: CombatState, handSize: number): void {
  state.turn += 1;
  state.cardsPlayedThisTurn = 0;
  if (!state.player.retainShield) state.player.shield = 0;
  state.player.retainShield = false;
  state.player.energy = state.player.maxEnergy;
  fireTriggers(state, "onTurnStart");
  drawCards(state, handSize);
}
