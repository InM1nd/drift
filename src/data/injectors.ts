import type { PotionData } from "../types";

/** 6 Инъекторов (docs/05-items.md) — тактические разовые, без цены Заряда, расходуются из инвентаря забега. */
export const INJECTORS: PotionData[] = [
  {
    id: "overdrive-stim",
    name: "Стим форсажа",
    description: "Получить 3 Форсажа на этот бой.",
    targeted: false,
    effects: [{ kind: "applyStatus", status: "overdrive", stacks: 3, target: "self" }],
  },
  {
    id: "shield-injector",
    name: "Щитовой инъектор",
    description: "Получить 8 Щита.",
    targeted: false,
    effects: [{ kind: "block", amount: 8 }],
  },
  {
    id: "combat-stimulant",
    name: "Боевой стимулятор",
    description: "Следующая атака в этом бою наносит двойной урон.",
    targeted: false,
    effects: [{ kind: "doubleNextAttack" }],
  },
  {
    id: "medgel",
    name: "Медгель",
    description: "Восстановить 15 HP.",
    targeted: false,
    effects: [{ kind: "heal", amount: 15 }],
  },
  {
    id: "reactor-booster",
    name: "Реакторный ускоритель",
    description: "Получить 2 Заряда в этот ход.",
    targeted: false,
    effects: [{ kind: "gainEnergy", amount: 2 }],
  },
  {
    id: "emp-injector",
    name: "ЭМИ-граната",
    description: "Наложить 2 Помех на всех врагов.",
    targeted: false,
    effects: [{ kind: "applyStatus", status: "jamming", stacks: 2, target: "allEnemies" }],
  },
];

export function getInjectorById(id: string): PotionData {
  const injector = INJECTORS.find((i) => i.id === id);
  if (!injector) throw new Error(`Неизвестный Инъектор: ${id}`);
  return injector;
}
