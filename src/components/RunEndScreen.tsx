import { useRunStore } from "../state/runStore";
import "./ScreenLayout.css";

export function RunEndScreen() {
  const runOutcome = useRunStore((s) => s.runOutcome);
  const credits = useRunStore((s) => s.credits);
  const deck = useRunStore((s) => s.deck);
  const resolvedNodeIds = useRunStore((s) => s.resolvedNodeIds);
  const startNewRun = useRunStore((s) => s.startNewRun);

  const victory = runOutcome === "victory";

  return (
    <div className={`screen-layout outcome-banner ${victory ? "victory" : "defeat"}`}>
      <h1>{victory ? "Забег пройден" : "Забег окончен"}</h1>
      <p className="screen-hint">
        {victory ? "Ядро-Страж уничтожено." : "Ныряльщик выведен из строя."}
      </p>
      <div className="run-end-stats">
        Узлов пройдено: {resolvedNodeIds.length} · Протоколов в колоде: {deck.length} · Кредиты: ₡ {credits}
      </div>
      <button type="button" className="primary-button" onClick={() => startNewRun()}>
        Новый забег
      </button>
    </div>
  );
}
