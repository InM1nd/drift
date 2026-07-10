import { useState } from "react";
import { useRunStore, REMOVAL_BASE_PRICE, REMOVAL_PRICE_STEP } from "../state/runStore";
import { getCardById } from "../data/cards";
import { getModuleById } from "../data/modules";
import { getInjectorById } from "../data/injectors";
import type { ShopOffer } from "../types";
import { HudRoomBackdrop } from "./HudRoomBackdrop";
import { CreditsIcon, InjectorIcon, ModuleIcon } from "./icons";
import { ProtocolIcon } from "./ProtocolIcon";
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
  const protocolOffers = shopOffers.filter((offer) => offer.kind === "card");
  const equipmentOffers = shopOffers.filter((offer) => offer.kind !== "card");

  return (
    <div className="screen-layout shop-screen">
      <HudRoomBackdrop kind="shop" />
      <ScreenHeader
        code="SUPPLY // TERMINAL"
        title="Терминал снабжения"
        aside={<div className="credits-bar"><small><CreditsIcon /> Баланс</small>₡ {credits}</div>}
      />

      <div className="section-heading"><span>Протоколы</span><small>{protocolOffers.length} шт.</small></div>
      <div className="shop-grid">
        {protocolOffers.map((offer) => {
          const { name, description } = offerDisplay(offer);
          const affordable = credits >= offer.price;
          return (
            <div key={`${offer.kind}-${offer.id}`} className="shop-item">
              <div className="offer-type">
                <ProtocolIcon type={getCardById(offer.id).type} />
              </div>
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
        {protocolOffers.length === 0 && <p className="screen-hint">Новых Протоколов нет.</p>}
      </div>

      <div className="section-heading"><span>Оснастка</span><small>{equipmentOffers.length} шт.</small></div>
      <div className="equipment-grid">
        {equipmentOffers.map((offer) => {
          const { name, description } = offerDisplay(offer);
          const affordable = credits >= offer.price;
          return (
            <div key={`${offer.kind}-${offer.id}`} className="equipment-item">
              <div className="equipment-glyph">
                {offer.kind === "module" ? <ModuleIcon /> : <InjectorIcon />}
              </div>
              <div className="equipment-copy">
                <div className="offer-type">{offer.kind === "module" ? "Модуль" : "Инъектор · одноразовый"}</div>
                <div className="card-name">{name}</div>
                <div className="card-desc">{description}</div>
              </div>
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
        {equipmentOffers.length === 0 && <p className="screen-hint">Оснастка распродана.</p>}
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
