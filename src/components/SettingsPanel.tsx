import type { CombatState } from "../engine/combatState";
import type { CombatMachineEvent } from "../engine/combatMachine";
import { DevPanel } from "./DevPanel";
import "./SettingsPanel.css";

interface SettingsPanelProps {
  /** Присутствует только когда настройки открыты изнутри боя — dev-инструменты бою и принадлежат. */
  devTools?: { combat: CombatState; send: (event: CombatMachineEvent) => void };
}

export function SettingsPanel({ devTools }: SettingsPanelProps) {
  return (
    <div className="settings-panel">
      {import.meta.env.DEV && devTools ? (
        <div className="settings-section">
          <span className="settings-label">Dev-инструменты</span>
          <DevPanel combat={devTools.combat} send={devTools.send} />
        </div>
      ) : null}
    </div>
  );
}
