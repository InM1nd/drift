import { describe, expect, it } from "vitest";
import { MAX_INJECTORS, useRunStore } from "./runStore";
import { MODULES } from "../data/modules";
import { INJECTORS } from "../data/injectors";
import { createInitialCombatState } from "../engine/combatState";
import { createRng } from "../engine/rng";
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
  // Дроп теперь шанс, не гарантия (см. lootRolls.test.ts) — перебираем сиды,
  // пока не встретим успешный, и проверяем инварианты именно на нём.
  it("победа над боем может выдать случайный Инъектор, пока есть свободный слот", () => {
    let granted = false;
    for (let seed = 0; seed < 50 && !granted; seed++) {
      useRunStore.getState().startNewRun();
      useRunStore.setState({ currentNodeId: nodeIdOfType("compartment"), rng: createRng(seed) });
      useRunStore.getState().resolveCombat("victory", 70, 0);
      const state = useRunStore.getState();
      if (state.injectorIds.length === 1) {
        granted = true;
        expect(INJECTORS.some((i) => i.id === state.injectorIds[0])).toBe(true);
        expect(state.pendingInjectorId).toBe(state.injectorIds[0]);
      }
    }
    expect(granted).toBe(true);
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

describe("runStore — Терминал снабжения продаёт Модули/Инъекторы (docs/06-map.md, B2.5)", () => {
  it("ассортимент включает Протоколы, один Модуль и один Инъектор при первом визите", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: nodeIdOfType("shop") });
    useRunStore.getState().enterNode();

    const offers = useRunStore.getState().shopOffers;
    expect(offers.filter((o) => o.kind === "card").length).toBe(3);
    expect(offers.filter((o) => o.kind === "module").length).toBe(1);
    expect(offers.filter((o) => o.kind === "injector").length).toBe(1);
  });

  it("покупка Модуля списывает кредиты и добавляет его в ownedModuleIds", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: nodeIdOfType("shop"), credits: 500 });
    useRunStore.getState().enterNode();
    const offer = useRunStore.getState().shopOffers.find((o) => o.kind === "module")!;
    const creditsBefore = useRunStore.getState().credits;

    useRunStore.getState().buyShopOffer(offer);

    const state = useRunStore.getState();
    expect(state.ownedModuleIds).toContain(offer.id);
    expect(state.credits).toBe(creditsBefore - offer.price);
    expect(state.shopOffers.some((o) => o.kind === "module")).toBe(false);
  });

  it("покупка Инъектора добавляет его в injectorIds", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: nodeIdOfType("shop"), credits: 500 });
    useRunStore.getState().enterNode();
    const offer = useRunStore.getState().shopOffers.find((o) => o.kind === "injector")!;

    useRunStore.getState().buyShopOffer(offer);

    expect(useRunStore.getState().injectorIds).toContain(offer.id);
  });

  it("без денег покупка не проходит", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: nodeIdOfType("shop"), credits: 0 });
    useRunStore.getState().enterNode();
    const offer = useRunStore.getState().shopOffers.find((o) => o.kind === "module")!;

    useRunStore.getState().buyShopOffer(offer);

    expect(useRunStore.getState().ownedModuleIds).toEqual([]);
    expect(useRunStore.getState().shopOffers.some((o) => o.kind === "module")).toBe(true);
  });

  it("если все Модули уже получены, Терминал не предлагает Модуль", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({ currentNodeId: nodeIdOfType("shop"), ownedModuleIds: MODULES.map((m) => m.id) });
    useRunStore.getState().enterNode();
    expect(useRunStore.getState().shopOffers.some((o) => o.kind === "module")).toBe(false);
  });

  it("если инвентарь Инъекторов полон, Терминал не предлагает Инъектор", () => {
    useRunStore.getState().startNewRun();
    useRunStore.setState({
      currentNodeId: nodeIdOfType("shop"),
      injectorIds: Array(MAX_INJECTORS).fill(INJECTORS[0].id),
    });
    useRunStore.getState().enterNode();
    expect(useRunStore.getState().shopOffers.some((o) => o.kind === "injector")).toBe(false);
  });
});
