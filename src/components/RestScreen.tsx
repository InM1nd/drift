import { useRunStore } from "../state/runStore";
import { getCardById, getUpgradedCardId } from "../data/cards";
import { GameMenu } from "./GameMenu";
import { RoomBackdrop } from "./RoomBackdrop";
import { HullIcon } from "./icons";
import { ProtocolIcon } from "./ProtocolIcon";
import { ScreenHeader } from "./ScreenHeader";
import "./ScreenLayout.css";

const REST_HEAL_FRACTION = 0.3;

export function RestScreen() {
  const deck = useRunStore((s) => s.deck);
  const playerHp = useRunStore((s) => s.player.hp);
  const playerMaxHp = useRunStore((s) => s.player.maxHp);
  const healPlayer = useRunStore((s) => s.healPlayer);
  const replaceCardInDeck = useRunStore((s) => s.replaceCardInDeck);
  const completeNode = useRunStore((s) => s.completeNode);

  const healAmount = Math.round(playerMaxHp * REST_HEAL_FRACTION);

  // Один пункт на уникальный апгрейдящийся id в колоде, с индексом первого вхождения.
  const upgradable = new Map<string, number>();
  deck.forEach((cardId, i) => {
    if (!upgradable.has(cardId) && getUpgradedCardId(cardId)) upgradable.set(cardId, i);
  });

  function handleHeal() {
    healPlayer(healAmount);
    completeNode();
  }

  function handleUpgrade(cardId: string, index: number) {
    const upgradedId = getUpgradedCardId(cardId);
    if (!upgradedId) return;
    replaceCardInDeck(index, upgradedId);
    completeNode();
  }

  return (
    <div className="screen-layout rest-screen">
      <RoomBackdrop kind="rest" />
      <ScreenHeader
        code="SERVICE // MAINTENANCE"
        title="Ремонтный отсек"
        aside={<div className="screen-health"><small><HullIcon /> Корпус</small>{playerHp}/{playerMaxHp}</div>}
      />
      <p className="screen-hint">Выбери одно: восстановить HP или улучшить один Протокол.</p>

      <div className="rest-choices">
        <div className="rest-choice">
          <div className="card-name">Восстановить HP</div>
          <div className="card-desc">
            {playerHp >= playerMaxHp ? "Корпус уже на максимуме." : `+${healAmount} HP (${playerHp}/${playerMaxHp})`}
          </div>
          <button
            type="button"
            className="primary-button"
            disabled={playerHp >= playerMaxHp}
            onClick={handleHeal}
          >
            Восстановить
          </button>
        </div>
      </div>

      <div className="section-heading"><span>Модификация Протокола</span><small>{upgradable.size} доступно</small></div>
      <div className="reward-grid">
        {[...upgradable.entries()].map(([cardId, index]) => {
          const base = getCardById(cardId);
          const upgraded = getCardById(getUpgradedCardId(cardId)!);
          return (
            <button
              key={cardId}
              type="button"
              className="reward-card"
              onClick={() => handleUpgrade(cardId, index)}
            >
              <ProtocolIcon type={base.type} />
              <div className="card-name">
                {base.name} → {upgraded.name}
              </div>
              <div className="card-desc">{upgraded.description}</div>
            </button>
          );
        })}
        {upgradable.size === 0 ? <p className="screen-hint">Подходящих Протоколов для апгрейда нет.</p> : null}
      </div>

      <GameMenu />
    </div>
  );
}
