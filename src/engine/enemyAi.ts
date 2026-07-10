import type { EnemyAction, EnemyData, EnemyPattern } from "../types";
import { getEnemyById } from "../data/enemies";
import type { CombatState, EnemyCombatantState } from "./combatState";
import { resolveEnemyAction } from "./resolveEffect";

/**
 * Разрешает паттерн в конкретный ход. `phase` переключает под-паттерн по
 * порогу HP (Ядро-Страж, docs/04-enemies.md) — под-цикл продолжает общий
 * `moveIndex`, а не начинается заново с нуля при смене фазы: для одного
 * фазового перехода за бой разница не ощущается, а трекать отдельно
 * "с какого хода мы в этой фазе" — сложность, которая того не стоит.
 */
function resolvePattern(pattern: EnemyPattern, enemy: EnemyCombatantState, data: EnemyData): EnemyAction {
  if (pattern.kind === "cycle") {
    const seqIndex = enemy.moveIndex % pattern.sequence.length;
    return data.moveset[pattern.sequence[seqIndex]];
  }
  if (pattern.kind === "phase") {
    const hpPercent = (enemy.hp / enemy.maxHp) * 100;
    const active = hpPercent <= pattern.hpThreshold ? pattern.after : pattern.before;
    return resolvePattern(active, enemy, data);
  }
  // weighted не задействован врагами Фазы 1/2.
  return data.moveset[0];
}

/**
 * Детерминированный выбор хода — не рандом, поэтому его можно посмотреть
 * заранее и показать как intent врага (docs/02-combat.md: "открытый intent —
 * главный источник тактики").
 */
export function peekNextMove(enemy: EnemyCombatantState): EnemyAction {
  const data = getEnemyById(enemy.enemyId);
  return resolvePattern(data.pattern, enemy, data);
}

export function runEnemyTurn(state: CombatState): void {
  // Снимок состава на начало хода: "summon" (Ядро-Страж) добавляет запись в
  // state.enemies посреди этого же прохода — без снимка for...of подхватил бы
  // её на том же индексе и подкрепление успело бы отыграть свой первый ход
  // мгновенно, а не с началом следующего хода врагов, как для любого другого
  // вражеского юнита.
  for (const enemy of [...state.enemies]) {
    if (enemy.hp <= 0) continue;
    const move = peekNextMove(enemy);
    resolveEnemyAction(move, enemy, state);
    enemy.moveIndex += 1;
    if (state.outcome !== "ongoing") return;
  }
}
