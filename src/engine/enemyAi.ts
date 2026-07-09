import type { EnemyAction } from "../types";
import { getEnemyById } from "../data/enemies";
import type { CombatState, EnemyCombatantState } from "./combatState";
import { resolveEnemyAction } from "./resolveEffect";

function pickMove(enemy: EnemyCombatantState): EnemyAction {
  const data = getEnemyById(enemy.enemyId);
  const pattern = data.pattern;
  if (pattern.kind === "cycle") {
    const seqIndex = enemy.moveIndex % pattern.sequence.length;
    return data.moveset[pattern.sequence[seqIndex]];
  }
  // weighted/phase не задействованы тремя рядовыми врагами Фазы 1.
  return data.moveset[0];
}

export function runEnemyTurn(state: CombatState): void {
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    const move = pickMove(enemy);
    resolveEnemyAction(move, enemy, state);
    enemy.moveIndex += 1;
    if (state.outcome !== "ongoing") return;
  }
}
