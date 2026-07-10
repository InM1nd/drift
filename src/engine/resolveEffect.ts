import type { Amount, CardData, Effect, Status, Trigger } from "../types";
import type { EnemyAction } from "../types";
import { getCardById } from "../data/cards";
import { getEnemyById } from "../data/enemies";
import type { CombatantState, CombatState, EnemyCombatantState } from "./combatState";
import { checkOutcome, drawCards, enemyFromData, pushLog } from "./combatState";
import { nextInt } from "./rng";

// docs/02-combat.md: Форсаж/Стабилизация — «на оставшийся бой» (не тикают, живут
// до конца боя или explicit-сброса), Помехи/Пробоина — «длительность в ходах»
// (тикают -1/ход). Отражение — не длительность вовсе, особый случай ниже.
const DECAYING_STATUSES: Status[] = ["jamming", "breach"];

const STATUS_LABELS: Record<Status, string> = {
  corrosion: "Коррозия",
  overdrive: "Форсаж",
  stabilization: "Стабилизация",
  jamming: "Помехи",
  breach: "Пробоина",
  reflect: "Отражение",
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
      base = state.lastCardCost;
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

/** Общий проход по Effect[] — переиспользуется картами (resolveCardEffects) и Инъекторами (useInjector). */
export function resolveEffects(effects: Effect[], state: CombatState, sourceName: string): void {
  for (const effect of effects) {
    applyEffect(effect, state, state.player, sourceName);
  }
}

export function resolveCardEffects(card: CardData, state: CombatState): void {
  resolveEffects(card.effects, state, card.name);
}

/**
 * Отражающая плита (docs/03-cards.md): статус "Отражение" — не длительность,
 * а флаг "в этот ход", поэтому спадает не декрементом, а обнулением
 * (см. особый случай в endPlayerTurn) — обычная модель статуса-счётчика
 * здесь не подходит, значение это урон за удар, а не число ходов.
 */
function reflectIfActive(state: CombatState, attacker: EnemyCombatantState): void {
  const reflect = state.player.statuses.reflect ?? 0;
  if (reflect <= 0) return;
  const dealt = applyDamage(state.player, attacker, reflect);
  pushLog(state, `Отражение: ${dealt} урона по ${attacker.name}.`);
  checkOutcome(state);
}

export function resolveEnemyAction(action: EnemyAction, enemy: EnemyCombatantState, state: CombatState): void {
  switch (action.kind) {
    case "damage": {
      const dealt = applyDamage(enemy, state.player, Math.ceil(action.amount * state.threatDamageMult));
      pushLog(state, `${enemy.name}: ${dealt} урона по Ныряльщику (HP ${state.player.hp}/${state.player.maxHp}).`);
      checkOutcome(state);
      reflectIfActive(state, enemy);
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
    case "summon": {
      // "Разовая подмога" (docs/04-enemies.md) — не завязано на позицию в
      // цикле (moveIndex продолжает идти через смену фазы, см. enemyAi.ts),
      // а на явный флаг: если уже призывал в этом бою, повторный заход в
      // этот слот цикла — no-op, а не вторая порция подкреплений.
      if (enemy.summonedOnce) {
        pushLog(state, `${enemy.name}: подкрепление уже вызвано в этом бою.`);
        break;
      }
      enemy.summonedOnce = true;
      const spawned = enemyFromData(getEnemyById(action.enemyId), state.rng);
      state.enemies.push(spawned);
      pushLog(state, `${enemy.name}: вызывает подкрепление — ${spawned.name} (HP ${spawned.hp}).`);
      break;
    }
    case "damageWithStatus": {
      const dealt = applyDamage(enemy, state.player, Math.ceil(action.amount * state.threatDamageMult));
      addStatus(state.player, action.status, action.stacks);
      pushLog(
        state,
        `${enemy.name}: ${dealt} урона по Ныряльщику + ${STATUS_LABELS[action.status]} +${action.stacks} (HP ${state.player.hp}/${state.player.maxHp}).`,
      );
      checkOutcome(state);
      reflectIfActive(state, enemy);
      break;
    }
    case "damagePerCardPlayed": {
      const base = action.perCard * state.cardsPlayedThisTurn;
      const dealt = applyDamage(enemy, state.player, Math.ceil(base * state.threatDamageMult));
      pushLog(
        state,
        `${enemy.name}: ${dealt} урона по Ныряльщику за ${state.cardsPlayedThisTurn} карт(ы), сыгранных в прошлый ход (HP ${state.player.hp}/${state.player.maxHp}).`,
      );
      checkOutcome(state);
      reflectIfActive(state, enemy);
      break;
    }
  }
}

function applyEffect(effect: Effect, state: CombatState, attacker: CombatantState, sourceName: string): void {
  switch (effect.kind) {
    case "damage": {
      let amount = computeAmount(effect.amount, state);
      // Боевой стимулятор (Инъектор): удваивает следующий эффект урона от игрока, затем гасится.
      if (attacker === state.player && state.player.doubleNextAttack) {
        amount *= 2;
        state.player.doubleNextAttack = false;
      }
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
        if (!effect.onlyIfPresent || (enemy.statuses[effect.status] ?? 0) > 0) {
          addStatus(enemy, effect.status, stacks);
          pushLog(state, `${sourceName}: ${STATUS_LABELS[effect.status]} +${stacks} на ${enemy.name}.`);
        } else {
          pushLog(state, `${sourceName}: на ${enemy.name} нет ${STATUS_LABELS[effect.status]} — эффект не сработал.`);
        }
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
    case "discard": {
      const count = computeAmount(effect.count, state);
      let discarded = 0;
      for (let i = 0; i < count && state.hand.length > 0; i++) {
        const idx = nextInt(state.rng, state.hand.length);
        const [cardId] = state.hand.splice(idx, 1);
        state.discardPile.push(cardId);
        discarded += 1;
      }
      pushLog(state, `${sourceName}: сброшено ${discarded} карт(ы).`);
      break;
    }
    case "doubleNextAttack": {
      state.player.doubleNextAttack = true;
      pushLog(state, `${sourceName}: следующая атака нанесёт двойной урон.`);
      break;
    }
  }
}

/** Триггеры активных Power-карт для заданной точки (см. docs/02-combat.md). */
export function fireTriggers(state: CombatState, point: Trigger): void {
  for (const cardId of state.activePowerIds) {
    const card = getCardById(cardId);
    if (card.trigger !== point) continue;
    // triggerAt — условие "именно N-я карта за ход" (Перегрузка ядра); без него триггер безусловный.
    if (card.triggerAt !== undefined && card.triggerAt !== state.cardsPlayedThisTurn) continue;
    resolveCardEffects(card, state);
  }
}

/** Отражающая обшивка (Модуль): в конце хода нанести врагу урон = текущему Щиту игрока. */
function applyReflectiveHullModule(state: CombatState): void {
  if (!state.modules.includes("reflective-hull") || state.player.shield <= 0) return;
  const enemy =
    (state.targetEnemyIndex !== null ? state.enemies[state.targetEnemyIndex] : undefined) ??
    aliveEnemies(state)[0];
  if (!enemy || enemy.hp <= 0) return;
  const dealt = applyDamage(state.player, enemy, state.player.shield);
  pushLog(state, `Отражающая обшивка: ${dealt} урона по ${enemy.name}.`);
  checkOutcome(state);
}

/**
 * Явный, строго упорядоченный переход конца хода игрока (docs/02-combat.md):
 * 1) тик Коррозии — урон ДО уменьшения стека; 2) спад временных статусов;
 * 3) триггеры onTurnEnd. Порядок специально вынесен в одну функцию, а не
 * разбросан по колбэкам — здесь живут все ошибки очерёдности.
 */
export function endPlayerTurn(state: CombatState): void {
  const all: CombatantState[] = [state.player, ...state.enemies.filter((e) => e.hp > 0)];
  // Нанитный резервуар (Модуль): Коррозия на врагах не тикает вниз — только урон.
  const naniteReservoir = state.modules.includes("nanite-reservoir");
  for (const c of all) {
    const stacks = c.statuses.corrosion ?? 0;
    if (stacks > 0) {
      c.hp = Math.max(0, c.hp - stacks);
      const isEnemy = c !== state.player;
      c.statuses.corrosion = isEnemy && naniteReservoir ? stacks : stacks - 1;
      const label = c === state.player ? "Ныряльщик" : (c as EnemyCombatantState).name;
      pushLog(state, `Коррозия: ${stacks} урона по ${label} (HP ${c.hp}).`);
    }
  }
  checkOutcome(state);

  for (const c of all) {
    for (const status of DECAYING_STATUSES) {
      const stacks = c.statuses[status];
      if (stacks && stacks > 0) {
        c.statuses[status] = stacks - 1 > 0 ? stacks - 1 : undefined;
      }
    }
    // Отражение — флаг "в этот ход", не длительность в ходах: гасим целиком,
    // а не декрементом (иначе число читалось бы как урон-за-удар минус 1).
    if ((c.statuses.reflect ?? 0) > 0) c.statuses.reflect = undefined;
  }

  fireTriggers(state, "onTurnEnd");
  applyReflectiveHullModule(state);

  state.discardPile.push(...state.hand);
  state.hand = [];
  // Индексы выбора карты/цели теряют смысл вместе со старой рукой — иначе
  // "выбор" молча прилипнет к случайной карте в новой руке следующего хода.
  state.selectedHandIndex = null;
  state.selectedInjectorIndex = null;
  state.targetEnemyIndex = null;
}

/** Начало хода игрока: спад щита (если не Retain), триггеры onTurnStart, добор. */
export function startPlayerTurn(state: CombatState, handSize: number): void {
  state.turn += 1;
  state.cardsPlayedThisTurn = 0;
  if (!state.player.retainShield) state.player.shield = 0;
  state.player.retainShield = false;
  state.player.energy = state.player.maxEnergy;
  // Взломанный чип приоритета (Модуль): первая карта за ход дешевле на 1 —
  // существующее nextCardCostReduction уже тратится на первую сыгранную карту
  // и обнуляется (playCard), новой логики резолвера не нужно.
  if (state.modules.includes("priority-chip")) state.player.nextCardCostReduction += 1;
  fireTriggers(state, "onTurnStart");
  drawCards(state, handSize);
}
