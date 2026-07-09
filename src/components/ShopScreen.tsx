import { useRunStore, REMOVAL_BASE_PRICE, REMOVAL_PRICE_STEP } from "../state/runStore";
import { getCardById } from "../data/cards";
import { getModuleById } from "../data/modules";
import { getInjectorById } from "../data/injectors";
import type { ShopOffer } from "../types";
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

  const removalPrice = REMOVAL_BASE_PRICE + REMOVAL_PRICE_STEP * removalsUsed;

  return (
    <div className="screen-layout">
      <h1>Терминал снабжения</h1>
      <div className="credits-bar">₡ {credits}</div>

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
                onClick={() => buyShopOffer(offer)}
              >
                ₡ {offer.price}
              </button>
            </div>
          );
        })}
        {shopOffers.length === 0 && <p className="screen-hint">Ассортимент распродан.</p>}
      </div>

      <p className="screen-hint">Удалить карту из колоды — ₡ {removalPrice} (растёт с каждым разом)</p>
      <div className="deck-list">
        {deck.map((cardId, i) => (
          <button
            key={i}
            type="button"
            disabled={credits < removalPrice}
            onClick={() => payRemoveCard(i)}
            title="Удалить эту карту из колоды"
          >
            {getCardById(cardId).name}
          </button>
        ))}
      </div>

      <button type="button" className="primary-button" onClick={completeNode}>
        Дальше →
      </button>
    </div>
  );
}
