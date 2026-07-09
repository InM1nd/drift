import { describe, expect, it } from "vitest";
import { useRunStore } from "./runStore";
import { MODULES } from "../data/modules";

describe("runStore — Модули (docs/05-items.md)", () => {
  it("победа над Стражем (элитой) выдаёт случайный ещё не полученный Модуль", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: "elite-1" });
    useRunStore.getState().resolveCombat("victory", 70, 0);

    const state = useRunStore.getState();
    expect(state.ownedModuleIds.length).toBe(1);
    expect(MODULES.some((m) => m.id === state.ownedModuleIds[0])).toBe(true);
    expect(state.pendingModuleId).toBe(state.ownedModuleIds[0]);
  });

  it("если все Модули уже получены, повторная победа над элитой не выдаёт дубликат", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: "elite-1", ownedModuleIds: MODULES.map((m) => m.id) });
    useRunStore.getState().resolveCombat("victory", 70, 0);

    const state = useRunStore.getState();
    expect(state.ownedModuleIds.length).toBe(MODULES.length);
    expect(state.pendingModuleId).toBeNull();
  });

  it("обычный Отсек не выдаёт Модуль", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: "compartment-1" });
    useRunStore.getState().resolveCombat("victory", 70, 0);
    expect(useRunStore.getState().ownedModuleIds).toEqual([]);
  });

  it("Боевой рекордер: Форсаж переносится в carriedOverdrive только если Модуль получен", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: "compartment-1", ownedModuleIds: ["combat-recorder"] });
    useRunStore.getState().resolveCombat("victory", 70, 4);
    expect(useRunStore.getState().carriedOverdrive).toBe(4);
  });

  it("без Боевого рекордера Форсаж не переносится между боями", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: "compartment-1" });
    useRunStore.getState().resolveCombat("victory", 70, 4);
    expect(useRunStore.getState().carriedOverdrive).toBe(0);
  });
});
