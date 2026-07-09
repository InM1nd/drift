import { useRunStore } from "../state/runStore";
import { getCardById } from "../data/cards";
import { getModuleById } from "../data/modules";
import "./ScreenLayout.css";

export function RewardScreen() {
  const rewardOffers = useRunStore((s) => s.rewardOffers);
  const pendingModuleId = useRunStore((s) => s.pendingModuleId);
  const claimReward = useRunStore((s) => s.claimReward);

  return (
    <div className="screen-layout">
      <h1>Награда</h1>
      {pendingModuleId && (
        <p className="screen-hint">
          Получен Модуль: <strong>{getModuleById(pendingModuleId).name}</strong> —{" "}
          {getModuleById(pendingModuleId).description}
        </p>
      )}
      <p className="screen-hint">Выбери один Протокол в колоду — или пропусти.</p>

      <div className="reward-grid">
        {rewardOffers.map((cardId) => {
          const card = getCardById(cardId);
          return (
            <button key={cardId} type="button" className="reward-card" onClick={() => claimReward(cardId)}>
              <div className="card-cost">{card.cost}</div>
              <div className="card-name">{card.name}</div>
              <div className="card-desc">{card.description}</div>
            </button>
          );
        })}
      </div>

      <button type="button" className="skip-button" onClick={() => claimReward(null)}>
        Пропустить
      </button>
    </div>
  );
}
