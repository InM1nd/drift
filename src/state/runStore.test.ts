import { describe, expect, it } from "vitest";
import { MAX_INJECTORS, useRunStore } from "./runStore";
import { MODULES } from "../data/modules";
import { INJECTORS } from "../data/injectors";
import { createInitialCombatState } from "../engine/combatState";
import type { MapNodeType } from "../types";

/** Карта теперь генерируется за забег (Milestone B) — ids не фиксированы, ищем узел по типу. */
function nodeIdOfType(type: MapNodeType): string {
  const node = useRunStore.getState().mapNodes.find((n) => n.type === type);
  if (!node) throw new Error(`Нет узла типа ${type} в сгенерированной карте`);
  return node.id;
}

describe("runStore — Модули (docs/05-items.md)", () => {
  it("победа над Стражем (элитой) выдаёт случайный ещё не полученный Модуль", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: nodeIdOfType("elite") });
    useRunStore.getState().resolveCombat("victory", 70, 0);

    const state = useRunStore.getState();
    expect(state.ownedModuleIds.length).toBe(1);
    expect(MODULES.some((m) => m.id === state.ownedModuleIds[0])).toBe(true);
    expect(state.pendingModuleId).toBe(state.ownedModuleIds[0]);
  });

  it("если все Модули уже получены, повторная победа над элитой не выдаёт дубликат", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: nodeIdOfType("elite"), ownedModuleIds: MODULES.map((m) => m.id) });
    useRunStore.getState().resolveCombat("victory", 70, 0);

    const state = useRunStore.getState();
    expect(state.ownedModuleIds.length).toBe(MODULES.length);
    expect(state.pendingModuleId).toBeNull();
  });

  it("обычный Отсек не выдаёт Модуль", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: nodeIdOfType("compartment") });
    useRunStore.getState().resolveCombat("victory", 70, 0);
    expect(useRunStore.getState().ownedModuleIds).toEqual([]);
  });

  it("Боевой рекордер: Форсаж переносится в carriedOverdrive только если Модуль получен", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: nodeIdOfType("compartment"), ownedModuleIds: ["combat-recorder"] });
    useRunStore.getState().resolveCombat("victory", 70, 4);
    expect(useRunStore.getState().carriedOverdrive).toBe(4);
  });

  it("без Боевого рекордера Форсаж не переносится между боями", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: nodeIdOfType("compartment") });
    useRunStore.getState().resolveCombat("victory", 70, 4);
    expect(useRunStore.getState().carriedOverdrive).toBe(0);
  });
});

describe("runStore — Инъекторы (docs/05-items.md)", () => {
  it("победа над боем выдаёт случайный Инъектор, пока есть свободный слот", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: nodeIdOfType("compartment") });
    useRunStore.getState().resolveCombat("victory", 70, 0);

    const state = useRunStore.getState();
    expect(state.injectorIds.length).toBe(1);
    expect(INJECTORS.some((i) => i.id === state.injectorIds[0])).toBe(true);
    expect(state.pendingInjectorId).toBe(state.injectorIds[0]);
  });

  it("инвентарь не растёт сверх MAX_INJECTORS", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({
      currentNodeId: nodeIdOfType("compartment"),
      injectorIds: Array(MAX_INJECTORS).fill(INJECTORS[0].id),
    });
    useRunStore.getState().resolveCombat("victory", 70, 0);

    const state = useRunStore.getState();
    expect(state.injectorIds.length).toBe(MAX_INJECTORS);
    expect(state.pendingInjectorId).toBeNull();
  });

  it("updateActiveCombat зеркалит расход Инъектора из боя в инвентарь забега", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ injectorIds: ["shield-injector", "medgel"] });
    const combat = createInitialCombatState(70, ["strike"], ["hull-turret"], 1, {
      injectorIds: ["medgel"], // как будто shield-injector уже потрачен в этом бою
    });
    useRunStore.getState().updateActiveCombat(combat);
    expect(useRunStore.getState().injectorIds).toEqual(["medgel"]);
  });
});
