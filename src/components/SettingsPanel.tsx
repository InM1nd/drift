import type { CombatState } from "../engine/combatState";
import type { CombatMachineEvent } from "../engine/combatMachine";
import { useSettingsStore } from "../state/settingsStore";
import { DevPanel } from "./DevPanel";
import { VisualStyleSwitch } from "./VisualStyleSwitch";
import "./SettingsPanel.css";

interface SettingsPanelProps {
  /** Присутствует только когда настройки открыты изнутри боя — dev-инструменты бою и принадлежат. */
  devTools?: { combat: CombatState; send: (event: CombatMachineEvent) => void };
}

export function SettingsPanel({ devTools }: SettingsPanelProps) {
  const visualStyle = useSettingsStore((s) => s.visualStyle);
  const setVisualStyle = useSettingsStore((s) => s.setVisualStyle);

  return (
    <div className="settings-panel">
      <div className="settings-section">
        <span className="settings-label">Визуальный стиль</span>
        <VisualStyleSwitch onChange={setVisualStyle} style={visualStyle} />
      </div>

      {import.meta.env.DEV && devTools ? (
        <div className="settings-section">
          <span className="settings-label">Dev-инструменты</span>
          <DevPanel combat={devTools.combat} send={devTools.send} />
        </div>
      ) : null}
    </div>
  );
}
