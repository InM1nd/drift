import { useState } from "react";
import driftLogo from "../assets/brand/drift-logo.png";
import driftPixelLogo from "../assets/brand/drift-logo-pixel.png";
import { useSettingsStore } from "../state/settingsStore";
import { RoomBackdrop } from "./RoomBackdrop";
import { SettingsPanel } from "./SettingsPanel";
import { PixelStartLayout } from "./pixel/PixelStartLayout";
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
  const visualStyle = useSettingsStore((s) => s.visualStyle);

  if (view === "menu" && visualStyle === "pixel") {
    return (
      <PixelStartLayout
        canContinue={canContinue}
        onContinue={onContinue}
        onNewRun={() => onNewRun(selectedThreat)}
        onOpenSettings={() => setView("settings")}
        onSelectThreat={setSelectedThreat}
        savedSummary={savedSummary}
        selectedThreat={selectedThreat}
        threatLevelsUnlocked={threatLevelsUnlocked}
      />
    );
  }

  return (
    <div className="screen-layout start-screen">
      <RoomBackdrop kind="map" />
      <h1 className="brand-title">
        <img className="brand-logo" src={driftLogo} alt="dRift" />
        <img className="brand-logo-pixel" src={driftPixelLogo} alt="dRift" />
      </h1>

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
