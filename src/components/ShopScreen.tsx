import { useRunStore, REMOVAL_BASE_PRICE, REMOVAL_PRICE_STEP } from "../state/runStore";
import { getCardById } from "../data/cards";
import "./ScreenLayout.css";

export function ShopScreen() {
  const credits = useRunStore((s) => s.credits);
  const shopOffers = useRunStore((s) => s.shopOffers);
  const deck = useRunStore((s) => s.deck);
  const removalsUsed = useRunStore((s) => s.removalsUsed);
  const buyCardOffer = useRunStore((s) => s.buyCardOffer);
  const payRemoveCard = useRunStore((s) => s.payRemoveCard);
  const completeNode = useRunStore((s) => s.completeNode);

  const removalPrice = REMOVAL_BASE_PRICE + REMOVAL_PRICE_STEP * removalsUsed;

  return (
    <div className="screen-layout">
      <h1>Терминал снабжения</h1>
      <div className="credits-bar">₡ {credits}</div>
      <p className="screen-hint">Модули и Инъекторы появятся здесь позже (Milestone B) — пока только Протоколы.</p>

      <div className="shop-grid">
        {shopOffers.map((offer) => {
          const card = getCardById(offer.cardId);
          const affordable = credits >= offer.price;
          return (
            <div key={offer.cardId} className="shop-item">
              <div className="card-name">{card.name}</div>
              <div className="card-desc">{card.description}</div>
              <button
                type="button"
                className="primary-button"
                disabled={!affordable}
                onClick={() => buyCardOffer(offer.cardId)}
              >
                ₡ {offer.price}
              </button>
            </div>
          );
        })}
        {shopOffers.length === 0 && <p className="screen-hint">Протоколы распроданы.</p>}
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
