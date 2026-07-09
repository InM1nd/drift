import { useMachine } from "@xstate/react";
import { combatMachine } from "../engine/combatMachine";
import { createInitialCombatState } from "../engine/combatState";
import { STARTER_DECK_IDS, getCardById } from "../data/cards";
import { DevPanel } from "./DevPanel";
import { StatusChips } from "./StatusChips";
import "./CombatScreen.css";

const INITIAL_ENEMY_ID = "sanitation-drone";
const INITIAL_PLAYER_HP = 70;

export function CombatScreen() {
  const [state, send] = useMachine(combatMachine, {
    input: {
      combat: createInitialCombatState(INITIAL_PLAYER_HP, STARTER_DECK_IDS, [INITIAL_ENEMY_ID], Date.now()),
    },
  });
  const combat = state.context.combat;
  const isPlayerTurn = state.value === "playerTurn";

  return (
    <div className="combat-screen">
      <div className="top-bar">
        <span>Ход {combat.turn + 1}</span>
        <span className="phase">{String(state.value)}</span>
      </div>

      <div className="enemy-zone">
        {combat.enemies.map((enemy, i) => (
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
        ))}
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
          {state.value === "victory" ? "Победа" : "Поражение"}
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
