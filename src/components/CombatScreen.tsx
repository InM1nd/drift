import { useEffect } from "react";
import { useMachine } from "@xstate/react";
import { combatMachine } from "../engine/combatMachine";
import { createInitialCombatState } from "../engine/combatState";
import type { CombatState, EnemyCombatantState } from "../engine/combatState";
import { computeDamage } from "../engine/resolveEffect";
import { peekNextMove } from "../engine/enemyAi";
import { getCardById } from "../data/cards";
import { getMapNodeById } from "../data/mapNodes";
import { useRunStore } from "../state/runStore";
import { DevPanel } from "./DevPanel";
import { StatusChips } from "./StatusChips";
import { STATUS_ICONS } from "./statusIcons";
import "./CombatScreen.css";

function intentFor(enemy: EnemyCombatantState, combat: CombatState): { icon: string; text: string } | null {
  if (enemy.hp <= 0) return null;
  const player = combat.player;
  const move = peekNextMove(enemy);
  switch (move.kind) {
    case "damage":
      return { icon: "⚔", text: String(computeDamage(enemy, player, move.amount)) };
    case "block":
      return { icon: "🛡", text: String(move.amount) };
    case "applyStatus":
      return { icon: STATUS_ICONS[move.status], text: `+${move.stacks}` };
    case "summon":
      return { icon: "➕", text: "?" };
    case "damageWithStatus":
      return {
        icon: "⚔",
        text: `${computeDamage(enemy, player, move.amount)}+${STATUS_ICONS[move.status]}${move.stacks}`,
      };
    case "damagePerCardPlayed": {
      // Живой прогноз "если ход закончится прямо сейчас" — обновляется по мере
      // розыгрыша карт, т.к. итоговое число карт за ход ещё не решено игроком.
      const base = move.perCard * combat.cardsPlayedThisTurn;
      return { icon: "⚔", text: `${computeDamage(enemy, player, base)} (×${move.perCard}/карта)` };
    }
  }
}

export function CombatScreen() {
  const node = useRunStore((s) => getMapNodeById(s.currentNodeId));
  const deck = useRunStore((s) => s.deck);
  const playerHp = useRunStore((s) => s.player.hp);
  const playerMaxHp = useRunStore((s) => s.player.maxHp);
  const combatSeed = useRunStore((s) => s.combatSeed);
  const activeCombatState = useRunStore((s) => s.activeCombatState);
  const ownedModuleIds = useRunStore((s) => s.ownedModuleIds);
  const carriedOverdrive = useRunStore((s) => s.carriedOverdrive);

  const [state, send] = useMachine(combatMachine, {
    input: {
      combat:
        activeCombatState ??
        createInitialCombatState(playerHp, deck, node.enemyIds ?? [], combatSeed ?? Date.now(), {
          playerMaxHp,
          modules: ownedModuleIds,
          carriedOverdrive,
        }),
    },
  });
  const combat = state.context.combat;
  const isPlayerTurn = state.value === "playerTurn";

  // Зеркалим состояние боя в runStore при каждом изменении — это и есть
  // снапшот для восстановления после перезагрузки (см. runStore.ts).
  useEffect(() => {
    useRunStore.getState().updateActiveCombat(combat);
  }, [combat]);

  function handleResolved() {
    useRunStore
      .getState()
      .resolveCombat(state.value as "victory" | "defeat", combat.player.hp, combat.player.statuses.overdrive ?? 0);
  }

  return (
    <div className="combat-screen">
      <div className="top-bar">
        <span>Ход {combat.turn + 1}</span>
        <span>{node.label}</span>
        <span className="phase">{String(state.value)}</span>
      </div>

      <div className="enemy-zone">
        {combat.enemies.map((enemy, i) => {
          const intent = intentFor(enemy, combat);
          return (
            <button
              key={i}
              type="button"
              className={[
                "enemy",
                combat.targetEnemyIndex === i ? "targeted" : "",
                enemy.hp <= 0 ? "dead" : "",
              ].join(" ")}
              onClick={() => send({ type: "TARGET_ENEMY", index: i })}
              disabled={enemy.hp <= 0 || !isPlayerTurn}
            >
              {intent && (
                <div className="enemy-intent" title="Intent — что враг сделает на следующем ходу">
                  {intent.icon} {intent.text}
                </div>
              )}
              <div className="enemy-name">{enemy.name}</div>
              <div className="hp-bar">
                <div className="hp-fill" style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }} />
              </div>
              <div className="hp-text">
                {Math.max(0, enemy.hp)}/{enemy.maxHp}
                {enemy.shield > 0 ? ` · 🛡${enemy.shield}` : ""}
              </div>
              <StatusChips statuses={enemy.statuses} />
            </button>
          );
        })}
      </div>

      <div className="player-status">
        <span>HP {combat.player.hp}/{combat.player.maxHp}</span>
        <span>Щит {combat.player.shield}</span>
        <span>Заряд {combat.player.energy}/{combat.player.maxEnergy}</span>
        <StatusChips statuses={combat.player.statuses} />
      </div>

      <div className="log" aria-live="polite">
        {combat.log.slice(-6).map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {(state.value === "victory" || state.value === "defeat") && (
        <div className={`outcome-banner ${state.value}`}>
          <div>{state.value === "victory" ? "Победа" : "Поражение"}</div>
          <button type="button" className="continue-button" onClick={handleResolved}>
            {state.value === "victory" ? "Продолжить →" : "Завершить забег"}
          </button>
        </div>
      )}

      <div className="hand-row">
        {combat.hand.map((cardId, i) => {
          const card = getCardById(cardId);
          return (
            <button
              key={i}
              type="button"
              className={`card ${combat.selectedHandIndex === i ? "selected" : ""}`}
              onClick={() => send({ type: "SELECT_CARD", index: i })}
              disabled={!isPlayerTurn}
            >
              <div className="card-cost">{card.cost}</div>
              <div className="card-name">{card.name}</div>
              <div className="card-desc">{card.description}</div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="end-turn"
        onClick={() => send({ type: "END_TURN" })}
        disabled={!isPlayerTurn}
      >
        Конец хода
      </button>

      {import.meta.env.DEV && <DevPanel combat={combat} send={send} />}
    </div>
  );
}
