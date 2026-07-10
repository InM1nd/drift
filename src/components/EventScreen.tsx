import { useRunStore } from "../state/runStore";
import { GameMenu } from "./GameMenu";
import { RoomBackdrop } from "./RoomBackdrop";
import { ScreenHeader } from "./ScreenHeader";
import "./ScreenLayout.css";

export function EventScreen() {
  const resolveSignalHack = useRunStore((s) => s.resolveSignalHack);
  const signalOutcome = useRunStore((s) => s.signalOutcome);
  const acknowledgeSignalOutcome = useRunStore((s) => s.acknowledgeSignalOutcome);
  const skipSignal = useRunStore((s) => s.skipSignal);

  return (
    <div className="screen-layout event-screen">
      <RoomBackdrop kind="signal" />
      <ScreenHeader code="SIGNAL // UNKNOWN SOURCE" title="Сигнал" />
      {signalOutcome ? (
        <>
          <div className="section-heading">
            <span>{signalOutcome.kind === "success" ? "Результат взлома" : "Контрмера контейнера"}</span>
            <small>{signalOutcome.kind === "success" ? `+₡ ${signalOutcome.creditsDelta}` : `-${signalOutcome.damage} HP`}</small>
          </div>
          <p className="screen-hint">{signalOutcome.text}</p>
          <button className="primary-button" onClick={acknowledgeSignalOutcome} type="button">
            Продолжить маршрут
          </button>
        </>
      ) : (
        <>
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
        </>
      )}

      <GameMenu />
    </div>
  );
}
