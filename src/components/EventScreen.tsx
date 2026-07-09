import { useRunStore } from "../state/runStore";
import "./ScreenLayout.css";

export function EventScreen() {
  const resolveSignalHack = useRunStore((s) => s.resolveSignalHack);
  const skipSignal = useRunStore((s) => s.skipSignal);

  return (
    <div className="screen-layout">
      <h1>Сигнал</h1>
      <p className="screen-hint">
        Обнаружен повреждённый контейнер данных. Взлом может выдать полезные кредиты — или спровоцировать
        защитный разряд.
      </p>

      <div className="rest-choices">
        <div className="rest-choice">
          <div className="card-name">Взломать</div>
          <div className="card-desc">50% — ₡ 20 · 50% — 8 урона</div>
          <button type="button" className="primary-button" onClick={resolveSignalHack}>
            Взломать
          </button>
        </div>
        <div className="rest-choice">
          <div className="card-name">Обойти стороной</div>
          <div className="card-desc">Ничего не происходит.</div>
          <button type="button" className="secondary-button" onClick={skipSignal}>
            Пропустить
          </button>
        </div>
      </div>
    </div>
  );
}
