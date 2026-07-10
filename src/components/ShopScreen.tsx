import { useState } from "react";
import { useRunStore, REMOVAL_BASE_PRICE, REMOVAL_PRICE_STEP } from "../state/runStore";
import { getCardById } from "../data/cards";
import { getModuleById } from "../data/modules";
import { getInjectorById } from "../data/injectors";
import type { ShopOffer } from "../types";
import { ScreenHeader } from "./ScreenHeader";
import "./ScreenLayout.css";

function offerDisplay(offer: ShopOffer): { name: string; description: string } {
  if (offer.kind === "card") return getCardById(offer.id);
  if (offer.kind === "module") return getModuleById(offer.id);
  return getInjectorById(offer.id);
}

export function ShopScreen() {
  const credits = useRunStore((s) => s.credits);
  const shopOffers = useRunStore((s) => s.shopOffers);
  const deck = useRunStore((s) => s.deck);
  const removalsUsed = useRunStore((s) => s.removalsUsed);
  const buyShopOffer = useRunStore((s) => s.buyShopOffer);
  const payRemoveCard = useRunStore((s) => s.payRemoveCard);
  const completeNode = useRunStore((s) => s.completeNode);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);

  const removalPrice = REMOVAL_BASE_PRICE + REMOVAL_PRICE_STEP * removalsUsed;

  return (
    <div className="screen-layout shop-screen">
      <ScreenHeader
        code="SUPPLY // TERMINAL"
        title="Терминал снабжения"
        aside={<div className="credits-bar"><small>Баланс</small>₡ {credits}</div>}
      />

      <div className="section-heading"><span>Доступные лоты</span><small>{shopOffers.length} шт.</small></div>
      <div className="shop-grid">
        {shopOffers.map((offer) => {
          const { name, description } = offerDisplay(offer);
          const affordable = credits >= offer.price;
          return (
            <div key={`${offer.kind}-${offer.id}`} className="shop-item">
              <div className="card-name">{name}</div>
              <div className="card-desc">{description}</div>
              <button
                type="button"
                className="primary-button"
                disabled={!affordable}
                title={affordable ? `Купить за ₡ ${offer.price}` : "Недостаточно кредитов"}
                onClick={() => buyShopOffer(offer)}
              >
                ₡ {offer.price}
              </button>
            </div>
          );
        })}
        {shopOffers.length === 0 && <p className="screen-hint">Ассортимент распродан.</p>}
      </div>

      <div className="section-heading"><span>Очистка колоды</span><small>₡ {removalPrice}</small></div>
      <p className="screen-hint">Удаление одного Протокола. Стоимость растёт после каждой операции.</p>
      <div className="deck-list">
        {deck.map((cardId, i) => (
          <button
            key={i}
            type="button"
            disabled={credits < removalPrice || pendingRemoveIndex === i}
            onClick={() => setPendingRemoveIndex(i)}
            title={credits < removalPrice ? "Недостаточно кредитов для удаления" : "Подготовить удаление этой карты"}
          >
            {getCardById(cardId).name}
          </button>
        ))}
      </div>
      {pendingRemoveIndex !== null ? (
        <div className="screen-actions">
          <span className="action-label">
            Подтверждение удаления // {getCardById(deck[pendingRemoveIndex]).name} · ₡ {removalPrice}
          </span>
          <div className="reward-grid">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                payRemoveCard(pendingRemoveIndex);
                setPendingRemoveIndex(null);
              }}
            >
              Подтвердить удаление
            </button>
            <button type="button" className="secondary-button" onClick={() => setPendingRemoveIndex(null)}>
              Отмена
            </button>
          </div>
        </div>
      ) : null}

      <button type="button" className="primary-button" onClick={completeNode}>
        Дальше →
      </button>
    </div>
  );
}
