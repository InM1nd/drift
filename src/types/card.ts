export type CardType = "attack" | "skill" | "power";

export type Status = "corrosion" | "overdrive" | "stabilization" | "jamming" | "breach" | "reflect";

export type Target = "enemy" | "self" | "allEnemies";

export type Trigger = "onTurnStart" | "onTurnEnd" | "onCardPlayed" | "onAttacked";

export type Amount =
  | number
  | {
      ref: "shield" | "corrosionOnTarget" | "cardsPlayedThisTurn" | "energySpent";
      mult?: number;
    };

export type Effect =
  | { kind: "damage"; amount: Amount; target: Target }
  | { kind: "block"; amount: Amount }
  | { kind: "heal"; amount: Amount }
  | { kind: "gainEnergy"; amount: Amount }
  | { kind: "applyStatus"; status: Status; stacks: Amount; target: Target; onlyIfPresent?: boolean }
  | { kind: "draw"; count: Amount }
  | { kind: "reduceNextCardCost"; amount: number }
  | { kind: "discard"; count: Amount }
  | { kind: "doubleNextAttack" };

export interface CardData {
  id: string;
  name: string;
  cost: number | "X";
  type: CardType;
  tags: string[];
  /** Человекочитаемый текст правил, см. "Эффект" в docs/03-cards.md. */
  description: string;
  exhaust?: boolean;
  retain?: boolean;
  trigger?: Trigger;
  /** Для trigger — условие "именно N-я карта, сыгранная за ход" (Перегрузка ядра). Без него триггер безусловный. */
  triggerAt?: number;
  effects: Effect[];
  /** id базового Протокола, если это его «+»-версия (docs/03-cards.md, правило апгрейда). */
  upgradeOf?: string;
}
