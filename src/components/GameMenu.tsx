import { useEffect, useState } from "react";
import type { CombatState } from "../engine/combatState";
import type { CombatMachineEvent } from "../engine/combatMachine";
import { useSettingsStore } from "../state/settingsStore";
import { HomeIcon, PlayIcon, SettingsIcon } from "./icons";
import { SettingsPanel } from "./SettingsPanel";
import "./ScreenLayout.css";
import "./GameMenu.css";

interface GameMenuProps {
  /** Присутствует только когда меню монтирует бой — дев-инструменты боевые. */
  devTools?: { combat: CombatState; send: (event: CombatMachineEvent) => void };
}

type MenuTab = "menu" | "settings";

export function GameMenu({ devTools }: GameMenuProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<MenuTab>("menu");
  const setAtTitle = useSettingsStore((s) => s.setAtTitle);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) {
    return (
      <button
        aria-label="Меню"
        className="game-menu-toggle"
        onClick={() => {
          setTab("menu");
          setOpen(true);
        }}
        type="button"
      >
        ☰
      </button>
    );
  }

  return (
    <div
      aria-modal="true"
      className="game-menu-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      role="dialog"
    >
      <div className="game-menu-panel">
        <div className="game-menu-header">
          <h2>{tab === "settings" ? "Настройки" : "Меню"}</h2>
          <button aria-label="Закрыть" className="game-menu-close" onClick={() => setOpen(false)} type="button">
            ×
          </button>
        </div>

        <div className="game-menu-tabs" role="tablist">
          <button
            aria-selected={tab === "menu"}
            className={tab === "menu" ? "active" : ""}
            onClick={() => setTab("menu")}
            role="tab"
            type="button"
          >
            Меню
          </button>
          <button
            aria-selected={tab === "settings"}
            className={tab === "settings" ? "active" : ""}
            onClick={() => setTab("settings")}
            role="tab"
            type="button"
          >
            <SettingsIcon /> Настройки
          </button>
        </div>

        <div className="game-menu-body">
          {tab === "menu" ? (
            <div className="game-menu-actions">
              <button className="game-menu-action primary" onClick={() => setOpen(false)} type="button">
                <PlayIcon />
                <span className="card-name">Продолжить</span>
                <span className="card-desc">Вернуться в игру</span>
              </button>
              <button
                className="game-menu-action"
                onClick={() => {
                  setAtTitle(true);
                  setOpen(false);
                }}
                type="button"
              >
                <HomeIcon />
                <span className="card-name">Главное меню</span>
                <span className="card-desc">Забег не прервётся — сохранён автоматически</span>
              </button>
            </div>
          ) : (
            <SettingsPanel devTools={devTools} />
          )}
        </div>
      </div>
    </div>
  );
}
