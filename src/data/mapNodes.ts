import type { MapNodeData } from "../types";

/**
 * Milestone B: узлы карты больше не фиксированный список — каждый забег
 * генерирует свой граф (см. src/engine/mapGenerator.ts), детерминировано
 * сидом захода. Этот файл — только чистый поиск по уже сгенерированному
 * массиву, который живёт в runStore (RunState.mapNodes).
 */
export function getMapNodeById(nodes: MapNodeData[], id: string): MapNodeData {
  const node = nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Unknown map node id: ${id}`);
  return node;
}
