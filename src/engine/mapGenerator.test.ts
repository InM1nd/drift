import { describe, expect, it } from "vitest";
import { generateMap } from "./mapGenerator";
import { createRng } from "./rng";

describe("generateMap — ветвящийся граф Акта 1 (docs/06-map.md)", () => {
  it("6–8 слоёв, последний — Ядро-Страж, предпоследний — Страж (единственные узлы своих слоёв)", () => {
    const { nodes, displayLayers } = generateMap(createRng(1));
    expect(displayLayers.length).toBeGreaterThanOrEqual(6);
    expect(displayLayers.length).toBeLessThanOrEqual(8);

    const byId = new Map(nodes.map((n) => [n.id, n]));
    const lastLayer = displayLayers[displayLayers.length - 1];
    const eliteLayer = displayLayers[displayLayers.length - 2];
    expect(lastLayer.length).toBe(1);
    expect(eliteLayer.length).toBe(1);
    expect(byId.get(lastLayer[0])?.type).toBe("boss");
    expect(byId.get(eliteLayer[0])?.type).toBe("elite");
    expect(byId.get(lastLayer[0])?.next).toEqual([]);
  });

  it("средние слои — 2-3 узла", () => {
    const { displayLayers } = generateMap(createRng(2));
    for (let i = 1; i < displayLayers.length - 2; i++) {
      expect(displayLayers[i].length).toBeGreaterThanOrEqual(2);
      expect(displayLayers[i].length).toBeLessThanOrEqual(3);
    }
  });

  it("каждый узел (кроме стартового) имеет ≥1 входящее ребро — недостижимых узлов нет", () => {
    const { nodes, displayLayers } = generateMap(createRng(3));
    const startId = displayLayers[0][0];
    for (const node of nodes) {
      if (node.id === startId) continue;
      const hasParent = nodes.some((maybeParent) => maybeParent.next.includes(node.id));
      expect(hasParent).toBe(true);
    }
  });

  it("каждый узел, кроме последнего слоя, имеет ≥1 исходящее ребро — тупиков до босса нет", () => {
    const { nodes, displayLayers } = generateMap(createRng(4));
    const bossId = displayLayers[displayLayers.length - 1][0];
    for (const node of nodes) {
      if (node.id === bossId) continue;
      expect(node.next.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("гарантирован хотя бы один Терминал снабжения и один Ремонтный отсек до Стража — на 200 сидах, не выборочно", () => {
    // 200, не 10: баг, где натурально выпавший "shop" затирался форсированным "rest"
    // на том же узле, проявлялся у меньшинства сидов (маленький средний слой) — 10
    // сидов этого не ловили, флейки-тест на Date.now() в runStore.test.ts ловил.
    for (let seed = 0; seed < 200; seed++) {
      const { nodes } = generateMap(createRng(seed));
      expect(nodes.some((n) => n.type === "shop")).toBe(true);
      expect(nodes.some((n) => n.type === "rest")).toBe(true);
    }
  });

  it("детерминировано: один и тот же сид даёт один и тот же граф", () => {
    const a = generateMap(createRng(42));
    const b = generateMap(createRng(42));
    expect(a).toEqual(b);
  });

  it("компартменты и элита/босс несут enemyIds, остальные типы — нет", () => {
    const { nodes } = generateMap(createRng(5));
    for (const node of nodes) {
      if (node.type === "compartment" || node.type === "elite" || node.type === "boss") {
        expect(node.enemyIds?.length).toBeGreaterThan(0);
      } else {
        expect(node.enemyIds).toBeUndefined();
      }
    }
  });
});
