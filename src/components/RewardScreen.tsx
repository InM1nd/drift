import { useState } from "react";
import { useRunStore } from "../state/runStore";
import { getCardById } from "../data/cards";
import { getModuleById } from "../data/modules";
import { getInjectorById } from "../data/injectors";
import { ScreenHeader } from "./ScreenHeader";
import "./ScreenLayout.css";

export function RewardScreen() {
  const rewardOffers = useRunStore((s) => s.rewardOffers);
  const pendingModuleId = useRunStore((s) => s.pendingModuleId);
  const pendingInjectorId = useRunStore((s) => s.pendingInjectorId);
  const lastCombatRewardCredits = useRunStore((s) => s.lastCombatRewardCredits);
  const claimReward = useRunStore((s) => s.claimReward);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  return (
    <div className="screen-layout reward-screen">
      <ScreenHeader code="RECOVERY // LOOT" title="Награда" />
      <div className="reward-notices">
        <p className="screen-hint">Боевой дебриф: +₡ {lastCombatRewardCredits} за зачистку сектора.</p>
        {pendingModuleId && (
          <p className="screen-hint">
            Получен Модуль: <strong>{getModuleById(pendingModuleId).name}</strong> —{" "}
            {getModuleById(pendingModuleId).description}
          </p>
        )}
        {pendingInjectorId && (
          <p className="screen-hint">
            Получен Инъектор: <strong>{getInjectorById(pendingInjectorId).name}</strong> —{" "}
            {getInjectorById(pendingInjectorId).description}
          </p>
        )}
      </div>
      <p className="screen-hint">Выбери один Протокол в колоду — или пропусти.</p>

      <div className="reward-grid">
        {rewardOffers.map((cardId) => {
          const card = getCardById(cardId);
          return (
            <button
              aria-pressed={selectedCardId === cardId}
              key={cardId}
              type="button"
              className={`reward-card ${selectedCardId === cardId ? "selected" : ""}`}
              onClick={() => setSelectedCardId(cardId)}
            >
              <div className="card-cost"><small>ЗРД</small>{card.cost}</div>
              <div className="card-name">{card.name}</div>
              <div className="card-desc">{card.description}</div>
            </button>
          );
        })}
        {rewardOffers.length === 0 ? <p className="screen-hint">Сектор пуст. Переходи дальше по маршруту.</p> : null}
      </div>

      <div className="screen-actions">
        <span className="action-label">{selectedCardId ? `Выбран: ${getCardById(selectedCardId).name}` : "Награда не выбрана"}</span>
        <div className="reward-grid">
          <button
            type="button"
            className="primary-button"
            disabled={!selectedCardId}
            onClick={() => selectedCardId && claimReward(selectedCardId)}
          >
            Подтвердить выбор
          </button>
          <button type="button" className="skip-button" onClick={() => claimReward(null)}>
            Пропустить
          </button>
        </div>
      </div>
    </div>
  );
}
