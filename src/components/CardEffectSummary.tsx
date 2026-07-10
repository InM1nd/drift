import type { Amount, CardData, Effect } from "../types";
import {
  AttackIcon,
  DiscardIcon,
  DrawIcon,
  EnergyIcon,
  RepairIcon,
  ShieldIcon,
} from "./icons";
import { STATUS_DESCRIPTIONS, STATUS_ICONS, STATUS_LABELS } from "./statusIcons";

function amountLabel(amount: Amount): string {
  if (typeof amount === "number") return String(amount);

  const refs = {
    shield: "ЩИТ",
    corrosionOnTarget: "КОР",
    cardsPlayedThisTurn: "КАРТЫ",
    energySpent: "ЗРД",
  } as const;
  const label = refs[amount.ref];
  return amount.mult && amount.mult !== 1 ? `${label}×${amount.mult}` : label;
}

function targetLabel(effect: Effect): string | null {
  if (!("target" in effect)) return null;
  if (effect.target === "allEnemies") return "ВСЕ";
  if (effect.target === "self") return "СЕБЕ";
  return null;
}

function EffectChip({ effect }: { effect: Effect }) {
  const target = targetLabel(effect);

  switch (effect.kind) {
    case "damage":
      return <span className="effect-chip effect-damage" title="Урон"><AttackIcon /> <strong>{amountLabel(effect.amount)}</strong>{target ? <small>{target}</small> : null}</span>;
    case "block":
      return <span className="effect-chip effect-block" title="Щит"><ShieldIcon /> <strong>+{amountLabel(effect.amount)}</strong></span>;
    case "heal":
      return <span className="effect-chip effect-heal" title="Ремонт корпуса"><RepairIcon /> <strong>+{amountLabel(effect.amount)}</strong></span>;
    case "gainEnergy":
      return <span className="effect-chip effect-energy" title="Заряд"><EnergyIcon /> <strong>+{amountLabel(effect.amount)}</strong></span>;
    case "applyStatus":
      return (
        <span className={`effect-chip status-${effect.status}`} title={STATUS_LABELS[effect.status]}>
          {STATUS_ICONS[effect.status]} <strong>+{amountLabel(effect.stacks)}</strong>{target ? <small>{target}</small> : null}
        </span>
      );
    case "draw":
      return <span className="effect-chip effect-draw" title="Добор Протоколов"><DrawIcon /> <strong>+{amountLabel(effect.count)}</strong></span>;
    case "reduceNextCardCost":
      return <span className="effect-chip effect-energy" title="Снижение стоимости"><EnergyIcon /> <strong>−{effect.amount}</strong></span>;
    case "discard":
      return <span className="effect-chip effect-discard" title="Сброс Протоколов"><DiscardIcon /> <strong>−{amountLabel(effect.count)}</strong></span>;
    case "doubleNextAttack":
      return <span className="effect-chip effect-damage" title="Удвоить следующую атаку"><AttackIcon /> <strong>×2</strong></span>;
  }
}

export function CardEffectSummary({ card }: { card: CardData }) {
  return (
    <div className="card-effects" aria-label={`Эффекты: ${card.description}`}>
      {card.effects.map((effect, index) => <EffectChip effect={effect} key={`${effect.kind}-${index}`} />)}
      {card.exhaust ? <span className="effect-tag">1×</span> : null}
      {card.retain ? <span className="effect-tag">HOLD</span> : null}
    </div>
  );
}

const LEGEND_EFFECTS: Array<{ effect: Effect; label: string; description: string }> = [
  { effect: { kind: "damage", amount: 6, target: "enemy" }, label: "Урон", description: "Снижает корпус выбранного противника." },
  { effect: { kind: "block", amount: 5 }, label: "Щит", description: "Поглощает входящий урон до конца хода." },
  { effect: { kind: "heal", amount: 5 }, label: "Ремонт", description: "Восстанавливает повреждённый корпус." },
  { effect: { kind: "gainEnergy", amount: 1 }, label: "Заряд", description: "Даёт ресурс для активации Протоколов." },
  { effect: { kind: "draw", count: 1 }, label: "Добор", description: "Перемещает карты из колоды в руку." },
];

export function EffectLegend() {
  return (
    <details className="effect-legend">
      <summary>Иконки эффектов</summary>
      <div className="effect-legend-menu">
        <span className="effect-legend-kicker">SYS // EFFECT INDEX</span>
        <div className="effect-legend-grid">
          {LEGEND_EFFECTS.map(({ effect, label, description }) => (
            <div className="effect-legend-item" key={effect.kind}>
              <EffectChip effect={effect} />
              <span className="effect-legend-copy">
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
            </div>
          ))}
          {Object.entries(STATUS_ICONS).map(([status, icon]) => {
            const typedStatus = status as keyof typeof STATUS_ICONS;
            return (
              <div className="effect-legend-item" key={status} title={STATUS_DESCRIPTIONS[typedStatus]}>
                <span className={`effect-chip status-${status}`}>{icon}</span>
                <span className="effect-legend-copy">
                  <strong>{STATUS_LABELS[typedStatus]}</strong>
                  <small>{STATUS_DESCRIPTIONS[typedStatus]}</small>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}
