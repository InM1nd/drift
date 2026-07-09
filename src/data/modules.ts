import type { RelicData } from "../types";

/**
 * Модули (docs/05-items.md) — реальные хуки в движке боя, не просто данные:
 * см. resolveEffect.ts (Нанитный резервуар, Отражающая обшивка), combatMachine.ts
 * (Взломанный чип приоритета), runStore.ts (Боевой рекордер — перенос между боями).
 * `effects`/`trigger` здесь декоративные (для будущего единообразного рендера
 * тултипа) — реальную логику каждого хука резолвер проверяет напрямую по id
 * через state.modules, а не через этот effects-массив.
 */
export const MODULES: RelicData[] = [
  {
    id: "nanite-reservoir",
    name: "Нанитный резервуар",
    description: "Коррозия, наложенная на врагов, никогда не уменьшается сама по себе.",
    effects: [],
  },
  {
    id: "reflective-hull",
    name: "Отражающая обшивка",
    description: "В конце хода нанести врагу урон, равный текущему Щиту.",
    trigger: "onTurnEnd",
    effects: [],
  },
  {
    id: "priority-chip",
    name: "Взломанный чип приоритета",
    description: "Первая карта, сыгранная за ход, стоит на 1 Заряд меньше.",
    effects: [],
  },
  {
    id: "combat-recorder",
    name: "Боевой рекордер",
    description: "Форсаж, полученный в бою, не сбрасывается между боями этого захода.",
    effects: [],
  },
];

export function getModuleById(id: string): RelicData {
  const module = MODULES.find((m) => m.id === id);
  if (!module) throw new Error(`Unknown module id: ${id}`);
  return module;
}
