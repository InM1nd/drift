import type { MapNodeData, MapNodeType } from "../types";
import { ENEMIES } from "../data/enemies";
import { nextInt, type RngState } from "./rng";

const MIN_LAYERS = 6;
const MAX_LAYERS = 8;
const MIN_MID_NODES = 2;
const MAX_MID_NODES = 3;

const NODE_LABELS: Record<MapNodeType, string> = {
  compartment: "Отсек",
  elite: "Страж",
  signal: "Сигнал",
  shop: "Терминал снабжения",
  rest: "Ремонтный отсек",
  boss: "Ядро-Страж",
};

// Компартмент чаще всего — основной "рядовой" контент слоя (docs/06-map.md).
const MID_NODE_TYPE_POOL: MapNodeType[] = ["compartment", "compartment", "compartment", "signal", "shop", "rest"];

export interface GeneratedMap {
  nodes: MapNodeData[];
  displayLayers: string[][];
}

function pickIndex(rng: RngState, length: number): number {
  return nextInt(rng, length);
}

function makeNode(type: MapNodeType, layerIndex: number, nodeIndex: number, rng: RngState): MapNodeData {
  const enemyIds =
    type === "compartment"
      ? [ENEMIES[pickIndex(rng, ENEMIES.length)].id]
      : type === "elite"
        ? ["guardian-hexapod"]
        : type === "boss"
          ? ["core-guardian"]
          : undefined;
  return {
    id: `${type}-${layerIndex}-${nodeIndex}`,
    type,
    label: NODE_LABELS[type],
    next: [],
    ...(enemyIds ? { enemyIds } : {}),
  };
}

/** Соединяет два соседних слоя рёбрами: у каждого узла следующего слоя ≥1
 *  входящее ребро (иначе недостижим), у каждого узла текущего слоя ≥1
 *  исходящее (иначе тупик до финального слоя) — оба свойства проверяются
 *  юнит-тестом на сгенерированном графе, а не только "на глаз".
 */
function connectLayers(prev: MapNodeData[], next: MapNodeData[], rng: RngState): void {
  for (const child of next) {
    const parentCount = prev.length === 1 ? 1 : 1 + nextInt(rng, Math.min(2, prev.length));
    const chosenParents = new Set<number>();
    while (chosenParents.size < parentCount) {
      chosenParents.add(pickIndex(rng, prev.length));
    }
    for (const parentIndex of chosenParents) {
      const parent = prev[parentIndex];
      if (!parent.next.includes(child.id)) parent.next.push(child.id);
    }
  }
  for (const parent of prev) {
    if (parent.next.length === 0) {
      parent.next.push(next[pickIndex(rng, next.length)].id);
    }
  }
}

/**
 * Ветвящийся граф Акта 1 (docs/06-map.md): N слоёв (6–8), 2–3 узла в
 * среднем слое, последний слой — всегда Ядро-Страж, предпоследний —
 * всегда Страж (элита), гарантирован хотя бы один Терминал снабжения и
 * один Ремонтный отсек перед боссом. Детерминировано переданным rng
 * (сид захода) — переигрываемость сида сохраняется бесплатно, т.к. rng
 * мутируется на месте и его финальный курсор возвращается вызывающему
 * коду вместе с остальным стором (см. createInitialRunState).
 */
export function generateMap(rng: RngState): GeneratedMap {
  const layerCount = MIN_LAYERS + nextInt(rng, MAX_LAYERS - MIN_LAYERS + 1);
  const midLayerCount = layerCount - 3; // минус старт, минус элита, минус босс

  const layers: MapNodeData[][] = [];
  layers.push([makeNode("compartment", 0, 0, rng)]);

  const midLayers: MapNodeData[][] = [];
  for (let li = 1; li <= midLayerCount; li++) {
    const nodeCount = MIN_MID_NODES + nextInt(rng, MAX_MID_NODES - MIN_MID_NODES + 1);
    const layer = Array.from({ length: nodeCount }, (_, ni) =>
      makeNode(MID_NODE_TYPE_POOL[pickIndex(rng, MID_NODE_TYPE_POOL.length)], li, ni, rng),
    );
    midLayers.push(layer);
    layers.push(layer);
  }

  // Гарантия: хотя бы один Терминал снабжения и один Ремонтный отсек до Стража.
  const midNodesFlat = midLayers.flat();
  for (const requiredType of ["shop", "rest"] as const) {
    if (!midNodesFlat.some((n) => n.type === requiredType)) {
      const target = midNodesFlat[pickIndex(rng, midNodesFlat.length)];
      target.type = requiredType;
      target.label = NODE_LABELS[requiredType];
      target.enemyIds = undefined;
    }
  }

  const eliteLayer = [makeNode("elite", layerCount - 2, 0, rng)];
  const bossLayer = [makeNode("boss", layerCount - 1, 0, rng)];
  layers.push(eliteLayer, bossLayer);

  for (let i = 0; i < layers.length - 1; i++) {
    connectLayers(layers[i], layers[i + 1], rng);
  }

  const nodes = layers.flat();
  const displayLayers = layers.map((layer) => layer.map((n) => n.id));
  return { nodes, displayLayers };
}
