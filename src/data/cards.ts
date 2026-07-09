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
    description: "Нанести 6 урона.",
    effects: [{ kind: "damage", amount: 6, target: "enemy" }],
  },
  {
    id: "barrier",
    name: "Барьер",
    cost: 1,
    type: "skill",
    tags: ["basic"],
    description: "Получить 5 Щита.",
    effects: [{ kind: "block", amount: 5 }],
  },
  {
    id: "caustic-charge",
    name: "Едкий заряд",
    cost: 1,
    type: "attack",
    tags: ["corrosion"],
    description: "Нанести 4 урона, наложить 2 Коррозии.",
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
    description: "Триггер (начало хода): наложить 1 Коррозию всем врагам, у которых уже есть Коррозия.",
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
    description: "Получить 9 Щита.",
    effects: [{ kind: "block", amount: 9 }],
  },
  {
    id: "counterstrike",
    name: "Контрудар",
    cost: 1,
    type: "attack",
    tags: ["shield"],
    description: "Нанести урон, равный текущему Щиту.",
    effects: [{ kind: "damage", amount: { ref: "shield" }, target: "enemy" }],
  },
  {
    id: "quick-access",
    name: "Быстрый доступ",
    cost: 0,
    type: "skill",
    tags: ["chain"],
    description: "Добрать 1 карту.",
    effects: [{ kind: "draw", count: 1 }],
  },
  {
    id: "chain-reaction",
    name: "Цепная реакция",
    cost: 2,
    type: "attack",
    tags: ["chain"],
    exhaust: true,
    description: "Нанести урон = ×3 от числа карт, сыгранных в этот ход. Расход.",
    effects: [{ kind: "damage", amount: { ref: "cardsPlayedThisTurn", mult: 3 }, target: "enemy" }],
  },
  {
    id: "weapon-overdrive",
    name: "Форсаж оружия",
    cost: 1,
    type: "power",
    tags: ["overdrive"],
    description: "Получить 2 Форсажа на весь бой.",
    effects: [{ kind: "applyStatus", status: "overdrive", stacks: 2, target: "self" }],
  },
  {
    id: "targeted-overdrive",
    name: "Прицельный форсаж",
    cost: 1,
    type: "attack",
    tags: ["overdrive"],
    description: "Нанести 7 урона, наложить 1 Пробоину на цель.",
    effects: [
      { kind: "damage", amount: 7, target: "enemy" },
      { kind: "applyStatus", status: "breach", stacks: 1, target: "enemy" },
    ],
  },
  // «+»-версии для Ремонтного отсека (Milestone A). Формула из docs/03-cards.md:
  // основной числовой эффект ×1.5, округление в пользу игрока; отклонения от
  // ×1.5 — только там, где сам доку явно показывает другой приём (усиление
  // статуса вместо урона, снятие Exhaust вместо роста числа), либо там, где
  // "40–50% от 1" не даёт целого шага, кроме +1.
  {
    id: "strike-plus",
    name: "Залп+",
    cost: 1,
    type: "attack",
    tags: ["basic"],
    upgradeOf: "strike",
    description: "Нанести 9 урона.",
    effects: [{ kind: "damage", amount: 9, target: "enemy" }],
  },
  {
    id: "barrier-plus",
    name: "Барьер+",
    cost: 1,
    type: "skill",
    tags: ["basic"],
    upgradeOf: "barrier",
    description: "Получить 8 Щита.",
    effects: [{ kind: "block", amount: 8 }],
  },
  {
    id: "caustic-charge-plus",
    name: "Едкий заряд+",
    cost: 1,
    type: "attack",
    tags: ["corrosion"],
    upgradeOf: "caustic-charge",
    description: "Нанести 4 урона, наложить 4 Коррозии.",
    effects: [
      { kind: "damage", amount: 4, target: "enemy" },
      { kind: "applyStatus", status: "corrosion", stacks: 4, target: "enemy" },
    ],
  },
  {
    id: "decay-catalyst-plus",
    name: "Катализатор распада+",
    cost: 2,
    type: "power",
    tags: ["corrosion"],
    trigger: "onTurnStart",
    upgradeOf: "decay-catalyst",
    description: "Триггер (начало хода): наложить 2 Коррозии всем врагам, у которых уже есть Коррозия.",
    effects: [
      { kind: "applyStatus", status: "corrosion", stacks: 2, target: "allEnemies", onlyIfPresent: true },
    ],
  },
  {
    id: "emergency-shield-plus",
    name: "Экстренный щит+",
    cost: 1,
    type: "skill",
    tags: ["shield"],
    upgradeOf: "emergency-shield",
    description: "Получить 14 Щита.",
    effects: [{ kind: "block", amount: 14 }],
  },
  {
    id: "counterstrike-plus",
    name: "Контрудар+",
    cost: 1,
    type: "attack",
    tags: ["shield"],
    upgradeOf: "counterstrike",
    description: "Нанести урон = ×1.5 от текущего Щита.",
    effects: [{ kind: "damage", amount: { ref: "shield", mult: 1.5 }, target: "enemy" }],
  },
  {
    id: "quick-access-plus",
    name: "Быстрый доступ+",
    cost: 0,
    type: "skill",
    tags: ["chain"],
    upgradeOf: "quick-access",
    description: "Добрать 2 карты.",
    effects: [{ kind: "draw", count: 2 }],
  },
  {
    id: "chain-reaction-plus",
    name: "Цепная реакция+",
    cost: 2,
    type: "attack",
    tags: ["chain"],
    upgradeOf: "chain-reaction",
    description: "Нанести урон = ×3 от числа карт, сыгранных в этот ход. Больше не Расход.",
    effects: [{ kind: "damage", amount: { ref: "cardsPlayedThisTurn", mult: 3 }, target: "enemy" }],
  },
  {
    id: "weapon-overdrive-plus",
    name: "Форсаж оружия+",
    cost: 1,
    type: "power",
    tags: ["overdrive"],
    upgradeOf: "weapon-overdrive",
    description: "Получить 3 Форсажа на весь бой.",
    effects: [{ kind: "applyStatus", status: "overdrive", stacks: 3, target: "self" }],
  },
  {
    id: "targeted-overdrive-plus",
    name: "Прицельный форсаж+",
    cost: 1,
    type: "attack",
    tags: ["overdrive"],
    upgradeOf: "targeted-overdrive",
    description: "Нанести 11 урона, наложить 1 Пробоину на цель.",
    effects: [
      { kind: "damage", amount: 11, target: "enemy" },
      { kind: "applyStatus", status: "breach", stacks: 1, target: "enemy" },
    ],
  },
];

export function getCardById(id: string): CardData {
  const card = CARDS.find((c) => c.id === id);
  if (!card) throw new Error(`Unknown card id: ${id}`);
  return card;
}

/** id «+»-версии для базового Протокола, если она есть (Ремонтный отсек). */
export function getUpgradedCardId(baseId: string): string | undefined {
  return CARDS.find((c) => c.upgradeOf === baseId)?.id;
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
