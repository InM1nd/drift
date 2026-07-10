import { useState } from "react";
import { RoomBackdrop } from "./RoomBackdrop";
import { SettingsPanel } from "./SettingsPanel";
import "./ScreenLayout.css";
import "./StartScreen.css";

export interface SavedRunSummary {
  hp: number;
  maxHp: number;
  credits: number;
  deckSize: number;
  nodeLabel: string;
}

interface StartScreenProps {
  canContinue: boolean;
  savedSummary: SavedRunSummary | null;
  threatLevelsUnlocked: boolean;
  onContinue: () => void;
  onNewRun: (threatLevel: number) => void;
}

export function StartScreen({ canContinue, savedSummary, threatLevelsUnlocked, onContinue, onNewRun }: StartScreenProps) {
  const [selectedThreat, setSelectedThreat] = useState(0);
  const [view, setView] = useState<"menu" | "settings">("menu");

  return (
    <div className="screen-layout start-screen">
      <RoomBackdrop kind="map" />
      <h1 className="start-screen-title">ДРЕЙФ</h1>

      {view === "settings" ? (
        <>
          <SettingsPanel />
          <button className="secondary-button" onClick={() => setView("menu")} type="button">
            Назад
          </button>
        </>
      ) : (
        <>
          {canContinue ? (
            <p className="screen-hint">
              {savedSummary ? (
                <>
                  Сектор <strong>{savedSummary.nodeLabel}</strong> · Корпус{" "}
                  <strong>
                    {savedSummary.hp}/{savedSummary.maxHp}
                  </strong>{" "}
                  · Кредиты <strong>₡ {savedSummary.credits}</strong> · Протоколы <strong>{savedSummary.deckSize}</strong>
                </>
              ) : (
                "Забег уже идёт."
              )}
            </p>
          ) : null}

          <div className="rest-choices">
            <div className="rest-choice">
              <div className="card-name">Уровень угрозы</div>
              <div className="card-desc">
                {threatLevelsUnlocked ? "Выбери интенсивность системной нагрузки." : "Разблокируется после победы над Ядром-Стражем."}
              </div>
              <div className="deck-list">
                {(threatLevelsUnlocked ? [0, 1, 2, 3, 4, 5] : [0]).map((level) => (
                  <button
                    aria-pressed={selectedThreat === level}
                    className={`threat-option${selectedThreat === level ? " active" : ""}`}
                    key={level}
                    onClick={() => setSelectedThreat(level)}
                    type="button"
                  >
                    T{level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="start-screen-actions">
            {canContinue ? (
              <button className="primary-button" onClick={onContinue} type="button">
                Продолжить забег
              </button>
            ) : null}
            <button
              className={canContinue ? "secondary-button" : "primary-button"}
              onClick={() => onNewRun(selectedThreat)}
              type="button"
            >
              Новый забег
            </button>
            <button className="secondary-button" onClick={() => setView("settings")} type="button">
              Настройки
            </button>
          </div>
        </>
      )}
    </div>
  );
}
