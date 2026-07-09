import { useState } from "react";
import type { CombatState } from "../engine/combatState";
import type { CombatMachineEvent } from "../engine/combatMachine";
import { ENEMIES } from "../data/enemies";
import type { Status } from "../types";
import "./DevPanel.css";

interface DevPanelProps {
  combat: CombatState;
  send: (event: CombatMachineEvent) => void;
}

const STATUSES: Status[] = ["corrosion", "overdrive", "stabilization", "jamming", "breach"];

export function DevPanel({ combat, send }: DevPanelProps) {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState(1);
  const [restartEnemyId, setRestartEnemyId] = useState(ENEMIES[0].id);

  if (!open) {
    return (
      <button type="button" className="dev-toggle" onClick={() => setOpen(true)}>
        dev
      </button>
    );
  }

  return (
    <div className="dev-panel">
      <div className="dev-panel-header">
        <span>Dev-панель · сид {combat.rng.seed}</span>
        <button type="button" onClick={() => setOpen(false)}>
          ×
        </button>
      </div>

      <div className="dev-row">
        <span>HP Ныряльщика</span>
        <input
          type="number"
          value={combat.player.hp}
          onChange={(e) => send({ type: "DEV_SET_HP", who: "player", hp: Number(e.target.value) })}
        />
      </div>

      <div className="dev-row wrap">
        <span>Статусы Ныряльщика</span>
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() =>
              send({
                type: "DEV_SET_STATUS",
                who: "player",
                status,
                stacks: (combat.player.statuses[status] ?? 0) + 1,
              })
            }
          >
            {status} {combat.player.statuses[status] ?? 0}
          </button>
        ))}
      </div>

      {combat.enemies.map((enemy, i) => (
        <div key={i}>
          <div className="dev-row">
            <span>HP {enemy.name}</span>
            <input
              type="number"
              value={enemy.hp}
              onChange={(e) => send({ type: "DEV_SET_HP", who: i, hp: Number(e.target.value) })}
            />
          </div>
          <div className="dev-row wrap">
            <span>Статусы {enemy.name}</span>
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() =>
                  send({ type: "DEV_SET_STATUS", who: i, status, stacks: (enemy.statuses[status] ?? 0) + 1 })
                }
              >
                {status} {enemy.statuses[status] ?? 0}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="dev-row">
        <span>Новый бой</span>
        <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
        <select value={restartEnemyId} onChange={(e) => setRestartEnemyId(e.target.value)}>
          {ENEMIES.map((enemy) => (
            <option key={enemy.id} value={enemy.id}>
              {enemy.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => send({ type: "DEV_RESTART", seed, enemyId: restartEnemyId, playerHp: 70 })}
        >
          Старт
        </button>
      </div>
    </div>
  );
}
