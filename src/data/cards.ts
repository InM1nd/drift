import type { CardData } from "../types";

/**
 * Phase 1 slice: 2 стартовых + 8 представительных карт (2 на архетип).
 * Выбраны так, чтобы вместе покрыть каждую ветку модели эффектов:
 * фиксированное значение, два разных динамических ref, applyStatus,
 * draw, immediate-Power, trigger-Power (onTurnStart), exhaust, cost 0.
 * Полный список 30 карт — docs/03-cards.md.
 */
export const CARDS: CardData[] = [
  {
    id: "strike",
    name: "Залп",
    cost: 1,
    type: "attack",
    tags: ["basic"],
    effects: [{ kind: "damage", amount: 6, target: "enemy" }],
  },
  {
    id: "barrier",
    name: "Барьер",
    cost: 1,
    type: "skill",
    tags: ["basic"],
    effects: [{ kind: "block", amount: 5 }],
  },
  {
    id: "caustic-charge",
    name: "Едкий заряд",
    cost: 1,
    type: "attack",
    tags: ["corrosion"],
    effects: [
      { kind: "damage", amount: 4, target: "enemy" },
      { kind: "applyStatus", status: "corrosion", stacks: 2, target: "enemy" },
    ],
  },
  {
    id: "decay-catalyst",
    name: "Катализатор распада",
    cost: 2,
    type: "power",
    tags: ["corrosion"],
    trigger: "onTurnStart",
    effects: [
      { kind: "applyStatus", status: "corrosion", stacks: 1, target: "allEnemies", onlyIfPresent: true },
    ],
  },
  {
    id: "emergency-shield",
    name: "Экстренный щит",
    cost: 1,
    type: "skill",
    tags: ["shield"],
    effects: [{ kind: "block", amount: 9 }],
  },
  {
    id: "counterstrike",
    name: "Контрудар",
    cost: 1,
    type: "attack",
    tags: ["shield"],
    effects: [{ kind: "damage", amount: { ref: "shield" }, target: "enemy" }],
  },
  {
    id: "quick-access",
    name: "Быстрый доступ",
    cost: 0,
    type: "skill",
    tags: ["chain"],
    effects: [{ kind: "draw", count: 1 }],
  },
  {
    id: "chain-reaction",
    name: "Цепная реакция",
    cost: 2,
    type: "attack",
    tags: ["chain"],
    exhaust: true,
    effects: [{ kind: "damage", amount: { ref: "cardsPlayedThisTurn", mult: 3 }, target: "enemy" }],
  },
  {
    id: "weapon-overdrive",
    name: "Форсаж оружия",
    cost: 1,
    type: "power",
    tags: ["overdrive"],
    effects: [{ kind: "applyStatus", status: "overdrive", stacks: 2, target: "self" }],
  },
  {
    id: "targeted-overdrive",
    name: "Прицельный форсаж",
    cost: 1,
    type: "attack",
    tags: ["overdrive"],
    effects: [
      { kind: "damage", amount: 7, target: "enemy" },
      { kind: "applyStatus", status: "breach", stacks: 1, target: "enemy" },
    ],
  },
];

export function getCardById(id: string): CardData {
  const card = CARDS.find((c) => c.id === id);
  if (!card) throw new Error(`Unknown card id: ${id}`);
  return card;
}

/** 5× Залп + 4× Барьер (см. бейзлайн в docs/08-roadmap.md) + по одной из представительных карт. */
export const STARTER_DECK_IDS: string[] = [
  ...Array(5).fill("strike"),
  ...Array(4).fill("barrier"),
  "caustic-charge",
  "decay-catalyst",
  "emergency-shield",
  "counterstrike",
  "quick-access",
  "chain-reaction",
  "weapon-overdrive",
  "targeted-overdrive",
];
