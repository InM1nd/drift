import { useState } from "react";
import { useRunStore } from "../state/runStore";
import { useMetaStore } from "../state/metaStore";
import { ScreenHeader } from "./ScreenHeader";
import "./ScreenLayout.css";

export function RunEndScreen() {
  const runOutcome = useRunStore((s) => s.runOutcome);
  const credits = useRunStore((s) => s.credits);
  const deck = useRunStore((s) => s.deck);
  const resolvedNodeIds = useRunStore((s) => s.resolvedNodeIds);
  const threatLevel = useRunStore((s) => s.threatLevel);
  const lastRunUnlockedThreat = useRunStore((s) => s.lastRunUnlockedThreat);
  const startNewRun = useRunStore((s) => s.startNewRun);
  const threatLevelsUnlocked = useMetaStore((s) => s.threatLevelsUnlocked);
  const [nextThreat, setNextThreat] = useState<number>(Math.min(5, threatLevel));

  const victory = runOutcome === "victory";

  return (
    <div className={`screen-layout run-end-screen outcome-banner ${victory ? "victory" : "defeat"}`}>
      <ScreenHeader code="RUN // SUMMARY" title={victory ? "Забег пройден" : "Забег окончен"} />
      <p className="screen-hint">
        {victory ? "Ядро-Страж уничтожено." : "Ныряльщик выведен из строя."} Текущий уровень угрозы: <strong>T{threatLevel}</strong>.
      </p>
      {lastRunUnlockedThreat ? (
        <p className="screen-hint"><strong>Разблокировано:</strong> уровни угрозы T1–T5 теперь доступны для нового забега.</p>
      ) : null}
      <div className="run-end-stats">
        <span><small>Узлы</small><strong>{resolvedNodeIds.length}</strong></span>
        <span><small>Протоколы</small><strong>{deck.length}</strong></span>
        <span><small>Кредиты</small><strong>₡ {credits}</strong></span>
      </div>
      <div className="deck-list">
        {(threatLevelsUnlocked ? [0, 1, 2, 3, 4, 5] : [0]).map((level) => (
          <button
            aria-pressed={nextThreat === level}
            className={`threat-option${nextThreat === level ? " active" : ""}`}
            key={level}
            onClick={() => setNextThreat(level)}
            type="button"
          >
            T{level}
          </button>
        ))}
      </div>
      <button type="button" className="primary-button" onClick={() => startNewRun(nextThreat)}>
        Новый забег
      </button>
    </div>
  );
}
