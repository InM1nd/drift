import driftPixelLogo from "../../assets/brand/drift-logo-pixel.png";
import continueIcon from "../../assets/pixel/icon-continue.png";
import diveIcon from "../../assets/pixel/icon-dive.png";
import settingsIcon from "../../assets/pixel/icon-settings.png";
import traceIcon from "../../assets/pixel/icon-trace.png";
import type { SavedRunSummary } from "../StartScreen";
import { RoomBackdrop } from "../RoomBackdrop";
import "./PixelLayout.css";
import "./PixelStartAltar.css";

interface PixelStartLayoutProps {
  canContinue: boolean;
  savedSummary: SavedRunSummary | null;
  threatLevelsUnlocked: boolean;
  selectedThreat: number;
  onSelectThreat: (threatLevel: number) => void;
  onContinue: () => void;
  onNewRun: () => void;
  onOpenSettings: () => void;
}

export function PixelStartLayout({
  canContinue,
  savedSummary,
  threatLevelsUnlocked,
  selectedThreat,
  onSelectThreat,
  onContinue,
  onNewRun,
  onOpenSettings,
}: PixelStartLayoutProps) {
  const threatOptions = threatLevelsUnlocked ? [0, 1, 2, 3, 4, 5] : [0];

  return (
    <div className="screen-layout start-screen pixel-start-screen">
      <RoomBackdrop kind="map" />

      <main className="pixel-altar-title">
        <header className="pixel-altar-crest">
          <h1>
            <img className="pixel-altar-logo" src={driftPixelLogo} alt="dRift" />
          </h1>
        </header>

        <section className="pixel-altar-niche" aria-label="Алтарь запуска">
          {canContinue && (
            <div className="pixel-altar-record">
              <img className="pixel-altar-icon" src={traceIcon} alt="" />
              <div>
                <span>СОХРАНЁННЫЙ СЛЕД</span>
                <strong>
                  {savedSummary
                    ? `${savedSummary.nodeLabel} · ${savedSummary.hp}/${savedSummary.maxHp} HP · ₡ ${savedSummary.credits}`
                    : "ЗАБЕГ УЖЕ ИДЁТ"}
                </strong>
              </div>
            </div>
          )}

          <fieldset className="pixel-altar-threat">
            <legend>ПЕЧАТЬ УГРОЗЫ</legend>
            <div>
              {threatOptions.map((level) => (
                <button
                  aria-label={`Уровень угрозы ${level}`}
                  aria-pressed={selectedThreat === level}
                  key={level}
                  onClick={() => onSelectThreat(level)}
                  type="button"
                >
                  <span>T{level}</span>
                </button>
              ))}
            </div>
            {!threatLevelsUnlocked && <small>Откроется после победы над Ядром-Стражем</small>}
          </fieldset>

          <nav className="pixel-altar-actions" aria-label="Действия">
            {canContinue && (
              <button className="pixel-altar-action pixel-altar-action-primary" onClick={onContinue} type="button">
                <img className="pixel-altar-icon" src={continueIcon} alt="" />
                <span>ПРОДОЛЖИТЬ</span>
              </button>
            )}
            <button
              className={`pixel-altar-action${canContinue ? "" : " pixel-altar-action-primary"}`}
              onClick={onNewRun}
              type="button"
            >
              <img className="pixel-altar-icon" src={diveIcon} alt="" />
              <span>НОВОЕ ПОГРУЖЕНИЕ</span>
            </button>
            <button className="pixel-altar-action pixel-altar-action-quiet" onClick={onOpenSettings} type="button">
              <img className="pixel-altar-icon" src={settingsIcon} alt="" />
              <span>НАСТРОЙКИ</span>
            </button>
          </nav>
        </section>
      </main>
    </div>
  );
}
