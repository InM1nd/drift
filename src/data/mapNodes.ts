import type { MapNodeData } from "../types";

/**
 * Milestone A (минимальный каркас Фазы 2): фиксированный путь Акта 1
 * из docs/06-map.md — "Старт → Отсек → Сигнал/Отсек → Страж → Терминал
 * снабжения → Ремонтный отсек → Ядро-Страж". Один явный выбор пути
 * (compartment-2 vs signal-1), оба сходятся к элите. Полный ветвящийся
 * граф на несколько слоёв — Milestone B.
 */
export const MAP_NODES: MapNodeData[] = [
  {
    id: "compartment-1",
    type: "compartment",
    label: "Отсек",
    enemyIds: ["sanitation-drone"],
    next: ["compartment-2", "signal-1"],
  },
  {
    id: "compartment-2",
    type: "compartment",
    label: "Отсек",
    enemyIds: ["hull-turret"],
    next: ["elite-1"],
  },
  {
    id: "signal-1",
    type: "signal",
    label: "Сигнал",
    next: ["elite-1"],
  },
  {
    id: "elite-1",
    type: "elite",
    label: "Страж",
    enemyIds: ["guardian-hexapod"],
    next: ["shop-1"],
  },
  {
    id: "shop-1",
    type: "shop",
    label: "Терминал снабжения",
    next: ["rest-1"],
  },
  {
    id: "rest-1",
    type: "rest",
    label: "Ремонтный отсек",
    next: ["boss-1"],
  },
  {
    id: "boss-1",
    type: "boss",
    label: "Ядро-Страж",
    enemyIds: ["core-guardian"],
    next: [],
  },
];

/** Только для отображения трека на MapScreen — какие узлы стоят на одном "слое". */
export const DISPLAY_LAYERS: string[][] = [
  ["compartment-1"],
  ["compartment-2", "signal-1"],
  ["elite-1"],
  ["shop-1"],
  ["rest-1"],
  ["boss-1"],
];

const NODES_BY_ID = new Map(MAP_NODES.map((n) => [n.id, n]));

export function getMapNodeById(id: string): MapNodeData {
  const node = NODES_BY_ID.get(id);
  if (!node) throw new Error(`Unknown map node id: ${id}`);
  return node;
}

export const FIRST_NODE_ID = MAP_NODES[0].id;
