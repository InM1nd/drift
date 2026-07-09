export type CardType = "attack" | "skill" | "power";

export type Status = "corrosion" | "overdrive" | "stabilization" | "jamming" | "breach";

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
  | { kind: "applyStatus"; status: Status; stacks: Amount; target: Target }
  | { kind: "draw"; count: Amount }
  | { kind: "reduceNextCardCost"; amount: number };

export interface CardData {
  id: string;
  name: string;
  cost: number | "X";
  type: CardType;
  tags: string[];
  exhaust?: boolean;
  retain?: boolean;
  trigger?: Trigger;
  effects: Effect[];
}
