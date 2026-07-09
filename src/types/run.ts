export type MapNodeType = "compartment" | "elite" | "signal" | "shop" | "rest" | "boss";

export interface MapNodeData {
  id: string;
  type: MapNodeType;
  label: string;
  /** id узлов, доступных дальше; >1 — точка выбора пути (docs/06-map.md). */
  next: string[];
  /** Для compartment/elite/boss — состав врагов этого узла. */
  enemyIds?: string[];
}

export type RunScreen = "boot" | "map" | "combat" | "reward" | "shop" | "rest" | "event" | "runEnd";

/** Терминал снабжения продаёт все три типа предметов (docs/06-map.md) — kind+id вместе однозначно определяют товар. */
export interface ShopOffer {
  kind: "card" | "module" | "injector";
  id: string;
  price: number;
}
