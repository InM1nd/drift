import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import { createRng, nextInt, shuffle, type RngState } from "../engine/rng";
import type { CombatState } from "../engine/combatState";
import { generateMap } from "../engine/mapGenerator";
import { rollInjectorDrop } from "../engine/lootRolls";
import { getThreatModifiers } from "../engine/threatLevel";
import { getMapNodeById } from "../data/mapNodes";
import { CARDS, STARTER_DECK_IDS, getCardById } from "../data/cards";
import { MODULES } from "../data/modules";
import { INJECTORS } from "../data/injectors";
import { useMetaStore } from "./metaStore";
import type { MapNodeData, RunScreen, ShopOffer } from "../types";

const MODULE_COMBAT_RECORDER = "combat-recorder";
// "инвентарь ограничен (например, 3 слота)" — docs/05-items.md.
export const MAX_INJECTORS = 3;

export const RUN_SAVE_KEY = "drift-run-v1";
const STARTING_HP = 70;
const STARTING_CREDITS = 99;
const REWARD_OFFER_COUNT = 4;
const SHOP_OFFER_COUNT = 3;
// Терминал снабжения: Протокол ~50–75, Модуль ~150–200, Инъектор ~20–35,
// удаление карты ~75–100 растёт с каждым разом — бейзлайн docs/08-roadmap.md.
const SHOP_CARD_PRICE_MIN = 50;
const SHOP_CARD_PRICE_SPAN = 26;
const SHOP_MODULE_PRICE_MIN = 150;
const SHOP_MODULE_PRICE_SPAN = 51;
const SHOP_INJECTOR_PRICE_MIN = 20;
const SHOP_INJECTOR_PRICE_SPAN = 16;
export const REMOVAL_BASE_PRICE = 75;
export const REMOVAL_PRICE_STEP = 25;

/** Пул наград — все Протоколы кроме стартовых и «+»-апгрейдов (те выдаются только в Ремонтном отсеке). */
const REWARD_POOL = CARDS.filter((c) => !c.tags.includes("basic") && !c.upgradeOf);

interface RunState {
  screen: RunScreen;
  seed: number;
  rng: RngState;
  credits: number;
  deck: string[];
  player: { hp: number; maxHp: number };
  /** Ветвящийся граф этого забега (docs/06-map.md) — сгенерирован один раз из seed при старте. */
  mapNodes: MapNodeData[];
  /** Только для отображения трека на MapScreen — какие узлы стоят на одном "слое". */
  displayLayers: string[][];
  currentNodeId: string;
  resolvedNodeIds: string[];
  combatSeed: number | null;
  /** Снапшот боя в процессе — сериализуется вместе с остальным стором,
   *  так CombatScreen может восстановиться байт-в-байт после перезагрузки
   *  (docs/07-architecture.md: "детерминизм и сохранение посреди боя"). */
  activeCombatState: CombatState | null;
  runOutcome: "victory" | "defeat" | null;
  removalsUsed: number;
  rewardOffers: string[];
  shopOffers: ShopOffer[];
  /** id владеемых Модулей (docs/05-items.md) — пока выдаются только Стражем-элитой. */
  ownedModuleIds: string[];
  /** Только что полученный Модуль — для отображения на RewardScreen, сбрасывается claimReward. */
  pendingModuleId: string | null;
  /** Форсаж на конец последнего боя — переносится в следующий бой, только если владеешь "Боевым рекордером". */
  carriedOverdrive: number;
  /** id Инъекторов в инвентаре забега (docs/05-items.md), максимум MAX_INJECTORS. */
  injectorIds: string[];
  /** Только что полученный Инъектор — для отображения на RewardScreen, сбрасывается claimReward. */
  pendingInjectorId: string | null;
  /** Уровень угрозы (docs/11-threat-level.md), 0 = без модификатора. Выбирается при старте, не меняется в течение забега. */
  threatLevel: number;
  /** Глобальное системное уведомление для короткого debrief в UI. */
  uiNotice: {
    id: number;
    kind: "success" | "warning" | "damage" | "system";
    text: string;
    sticky?: boolean;
  } | null;
  /** Результат события "Сигнал", подтверждается игроком на EventScreen. */
  signalOutcome: {
    kind: "success" | "damage";
    text: string;
    creditsDelta: number;
    damage: number;
  } | null;
  /** Кредиты, полученные за последний бой перед RewardScreen. */
  lastCombatRewardCredits: number;
  /** Флаг только для завершённого забега: была ли в этом конце разблокировка угрозы. */
  lastRunUnlockedThreat: boolean;
}

interface RunActions {
  startNewRun: (threatLevel?: number) => void;
  enterNode: () => void;
  resolveCombat: (outcome: "victory" | "defeat", finalPlayerHp: number, finalOverdrive: number) => void;
  claimReward: (cardId: string | null) => void;
  buyShopOffer: (offer: ShopOffer) => void;
  payRemoveCard: (index: number) => void;
  resolveSignalHack: () => void;
  acknowledgeSignalOutcome: () => void;
  skipSignal: () => void;
  updateActiveCombat: (combat: CombatState) => void;
  addCardToDeck: (cardId: string) => void;
  removeCardFromDeck: (index: number) => void;
  replaceCardInDeck: (index: number, newCardId: string) => void;
  spendCredits: (amount: number) => boolean;
  healPlayer: (amount: number) => void;
  damagePlayer: (amount: number) => void;
  incrementRemovals: () => void;
  completeNode: () => void;
  choose: (nextId: string) => void;
  clearUiNotice: () => void;
}

type RunStore = RunState & RunActions;

function createInitialRunState(seed: number, threatLevel = 0): RunState {
  const rng = createRng(seed);
  // Генерация карты — часть детерминированного потока сида: расходует
  // курсор rng здесь же, до того как он пойдёт на что-либо ещё, поэтому
  // весь остальной забег (магазин, награды, сигналы) переигрывается 1-в-1.
  const { nodes, displayLayers } = generateMap(rng);
  const threatMods = getThreatModifiers(threatLevel);
  return {
    screen: "map",
    seed,
    rng,
    credits: STARTING_CREDITS + threatMods.startingCreditsDelta,
    deck: [...STARTER_DECK_IDS],
    player: { hp: STARTING_HP, maxHp: STARTING_HP },
    mapNodes: nodes,
    displayLayers,
    currentNodeId: nodes[0].id,
    resolvedNodeIds: [],
    combatSeed: null,
    activeCombatState: null,
    runOutcome: null,
    removalsUsed: 0,
    rewardOffers: [],
    shopOffers: [],
    ownedModuleIds: [],
    pendingModuleId: null,
    carriedOverdrive: 0,
    injectorIds: [],
    pendingInjectorId: null,
    threatLevel,
    uiNotice: null,
    signalOutcome: null,
    lastCombatRewardCredits: 0,
    lastRunUnlockedThreat: false,
  };
}

const idbStorage: StateStorage = {
  getItem: async (name) => (await idbGet(name)) ?? null,
  setItem: async (name, value) => {
    await idbSet(name, value);
  },
  removeItem: async (name) => {
    await idbDel(name);
  },
};

export const useRunStore = create<RunStore>()(
  persist(
    (set, get) => ({
      ...createInitialRunState(Date.now()),

      startNewRun: (threatLevel = 0) => set(createInitialRunState(Date.now(), threatLevel)),

      enterNode: () => {
        const state = get();
        const node = getMapNodeById(state.mapNodes, state.currentNodeId);
        if (node.type === "compartment" || node.type === "elite" || node.type === "boss") {
          const rng = { ...state.rng };
          const combatSeed = nextInt(rng, 2 ** 31);
          set({ screen: "combat", combatSeed, rng });
          return;
        }
        if (node.type === "shop") {
          const rng = { ...state.rng };
          const offerCards = shuffle(rng, REWARD_POOL).slice(0, SHOP_OFFER_COUNT);
          const cardOffers: ShopOffer[] = offerCards.map((c) => ({
            kind: "card",
            id: c.id,
            price: SHOP_CARD_PRICE_MIN + nextInt(rng, SHOP_CARD_PRICE_SPAN),
          }));
          // Терминал снабжения продаёт Протоколы/Модули/Инъекторы (docs/06-map.md)
          // — по одному предложению каждого из последних двух за визит, если есть что предлагать.
          const unownedModules = MODULES.filter((m) => !state.ownedModuleIds.includes(m.id));
          const moduleOffers: ShopOffer[] =
            unownedModules.length > 0
              ? [
                  {
                    kind: "module",
                    id: unownedModules[nextInt(rng, unownedModules.length)].id,
                    price: SHOP_MODULE_PRICE_MIN + nextInt(rng, SHOP_MODULE_PRICE_SPAN),
                  },
                ]
              : [];
          const injectorOffers: ShopOffer[] =
            state.injectorIds.length < MAX_INJECTORS
              ? [
                  {
                    kind: "injector",
                    id: INJECTORS[nextInt(rng, INJECTORS.length)].id,
                    price: SHOP_INJECTOR_PRICE_MIN + nextInt(rng, SHOP_INJECTOR_PRICE_SPAN),
                  },
                ]
              : [];
          set({ screen: "shop", rng, shopOffers: [...cardOffers, ...moduleOffers, ...injectorOffers] });
          return;
        }
        const screenByType: Record<string, RunScreen> = { rest: "rest", signal: "event" };
        set({ screen: screenByType[node.type] });
      },

      resolveCombat: (outcome, finalPlayerHp, finalOverdrive) => {
        if (outcome === "defeat") {
          set({
            screen: "runEnd",
            runOutcome: "defeat",
            activeCombatState: null,
            combatSeed: null,
            uiNotice: { id: Date.now(), kind: "damage", text: "Связь с ныряльщиком потеряна.", sticky: true },
            lastRunUnlockedThreat: false,
            lastCombatRewardCredits: 0,
          });
          return;
        }
        const state = get();
        const node = getMapNodeById(state.mapNodes, state.currentNodeId);
        const nextPlayer = { ...state.player, hp: Math.max(0, Math.min(state.player.maxHp, finalPlayerHp)) };
        // Боевой рекордер (Модуль): Форсаж переносится в следующий бой этого захода.
        const carriedOverdrive = state.ownedModuleIds.includes(MODULE_COMBAT_RECORDER) ? finalOverdrive : 0;
        if (node.type === "boss") {
          // Разблокировка Уровня угрозы (docs/11-threat-level.md): любая победа над
          // боссом, в т.ч. на Уровне 0, открывает все уровни 1–5 сразу — не лестницу.
          const metaState = useMetaStore.getState();
          const shouldUnlockThreat = !metaState.threatLevelsUnlocked;
          metaState.unlockThreatLevels();
          set({
            screen: "runEnd",
            runOutcome: "victory",
            player: nextPlayer,
            activeCombatState: null,
            combatSeed: null,
            carriedOverdrive,
            uiNotice: {
              id: Date.now(),
              kind: "success",
              text: shouldUnlockThreat
                ? "Ядро-Страж уничтожено. Уровни угрозы 1–5 разблокированы."
                : "Ядро-Страж уничтожен. Маршрут очищен.",
              sticky: true,
            },
            lastRunUnlockedThreat: shouldUnlockThreat,
            lastCombatRewardCredits: 0,
          });
          return;
        }
        const rng = { ...state.rng };
        // Отсек 10–20, Страж (элита) 25–35 кредитов — бейзлайн docs/08-roadmap.md.
        const [min, span] = node.type === "elite" ? [25, 11] : [10, 11];
        const reward = min + nextInt(rng, span);
        const rewardOffers = shuffle(rng, REWARD_POOL).slice(0, REWARD_OFFER_COUNT).map((c) => c.id);
        // Страж (элита) даёт случайный ещё не полученный Модуль (docs/06-map.md).
        const unownedModules = MODULES.filter((m) => !state.ownedModuleIds.includes(m.id));
        const grantedModule =
          node.type === "elite" && unownedModules.length > 0
            ? unownedModules[nextInt(rng, unownedModules.length)]
            : null;
        // Инъекторы "дропаются с боёв" (docs/05-items.md) — шанс, не гарантия
        // (см. lootRolls.ts), и только пока есть свободный слот; шанс параметризован
        // Уровнем угрозы (docs/11-threat-level.md).
        const grantedInjectorId = rollInjectorDrop(
          rng,
          state.injectorIds.length,
          MAX_INJECTORS,
          getThreatModifiers(state.threatLevel).injectorDropChancePct,
        );
        set({
          screen: "reward",
          player: nextPlayer,
          credits: state.credits + reward,
          rng,
          activeCombatState: null,
          combatSeed: null,
          rewardOffers,
          carriedOverdrive,
          ownedModuleIds: grantedModule ? [...state.ownedModuleIds, grantedModule.id] : state.ownedModuleIds,
          pendingModuleId: grantedModule?.id ?? null,
          injectorIds: grantedInjectorId ? [...state.injectorIds, grantedInjectorId] : state.injectorIds,
          pendingInjectorId: grantedInjectorId,
          lastCombatRewardCredits: reward,
          uiNotice: { id: Date.now(), kind: "success", text: `Сектор очищен. Получено ₡ ${reward}.` },
        });
      },

      claimReward: (cardId) => {
        if (cardId) {
          const card = getCardById(cardId);
          get().addCardToDeck(cardId);
          set({ uiNotice: { id: Date.now(), kind: "success", text: `Протокол "${card.name}" добавлен в колоду.` } });
        } else {
          set({ uiNotice: { id: Date.now(), kind: "warning", text: "Награда пропущена. Канал очищен." } });
        }
        set({ rewardOffers: [], pendingModuleId: null, pendingInjectorId: null });
        get().completeNode();
      },

      buyShopOffer: (offer) => {
        const state = get();
        const found = state.shopOffers.find((o) => o.kind === offer.kind && o.id === offer.id);
        if (!found || !get().spendCredits(found.price)) return;
        if (found.kind === "card") get().addCardToDeck(found.id);
        else if (found.kind === "module") set((s) => ({ ownedModuleIds: [...s.ownedModuleIds, found.id] }));
        else set((s) => ({ injectorIds: [...s.injectorIds, found.id] }));
        set((s) => ({ shopOffers: s.shopOffers.filter((o) => !(o.kind === found.kind && o.id === found.id)) }));
        const itemName =
          found.kind === "card"
            ? getCardById(found.id).name
            : found.kind === "module"
              ? MODULES.find((m) => m.id === found.id)?.name ?? "Модуль"
              : INJECTORS.find((i) => i.id === found.id)?.name ?? "Инъектор";
        set({
          uiNotice: {
            id: Date.now(),
            kind: "success",
            text: `Покупка подтверждена: ${itemName} за ₡ ${found.price}.`,
          },
        });
      },

      payRemoveCard: (index) => {
        const price = REMOVAL_BASE_PRICE + REMOVAL_PRICE_STEP * get().removalsUsed;
        if (!get().spendCredits(price)) return;
        const cardId = get().deck[index];
        const cardName = cardId ? getCardById(cardId).name : "Протокол";
        get().removeCardFromDeck(index);
        get().incrementRemovals();
        set({
          uiNotice: { id: Date.now(), kind: "warning", text: `${cardName} удалён из колоды за ₡ ${price}.` },
        });
      },

      // Сигнал: 50/50 взлом контейнера — кредиты или урон (Milestone A, единственное
      // событие среза; пул из "найденных данных/аномалии/ловушки" — Milestone B).
      resolveSignalHack: () => {
        const state = get();
        const rng = { ...state.rng };
        const success = nextInt(rng, 2) === 0;
        set({ rng, signalOutcome: null });
        if (success) {
          set({
            signalOutcome: {
              kind: "success",
              text: "Данные извлечены. Контейнер выдал кредитный пакет.",
              creditsDelta: 20,
              damage: 0,
            },
          });
          return;
        }
        set({
          signalOutcome: {
            kind: "damage",
            text: "Контейнер выдал защитный разряд. Корпус получил повреждение.",
            creditsDelta: 0,
            damage: 8,
          },
        });
      },

      acknowledgeSignalOutcome: () => {
        const outcome = get().signalOutcome;
        if (!outcome) return;
        set({ signalOutcome: null });
        if (outcome.creditsDelta > 0) {
          set((s) => ({ credits: s.credits + outcome.creditsDelta }));
          set({
            uiNotice: { id: Date.now(), kind: "success", text: `Сигнал расшифрован: +₡ ${outcome.creditsDelta}.` },
          });
        }
        if (outcome.damage > 0) {
          get().damagePlayer(outcome.damage);
          if (get().screen !== "runEnd") {
            set({
              uiNotice: { id: Date.now(), kind: "damage", text: `Сигнал активировал ловушку: -${outcome.damage} HP.` },
            });
          }
        }
        if (get().screen !== "runEnd") get().completeNode();
      },

      skipSignal: () => {
        set({ uiNotice: { id: Date.now(), kind: "system", text: "Сигнал проигнорирован. Маршрут без изменений." } });
        get().completeNode();
      },

      // injectorIds зеркалится вместе со снапшотом боя — Инъекторы расходуются
      // внутри боя (combat.injectors), а инвентарь забега должен видеть это
      // сразу же, иначе рестор после перезагрузки посреди боя вернул бы
      // уже потраченный Инъектор обратно в инвентарь.
      updateActiveCombat: (combat) => set({ activeCombatState: combat, injectorIds: combat.injectors }),

      addCardToDeck: (cardId) => set((state) => ({ deck: [...state.deck, cardId] })),

      removeCardFromDeck: (index) =>
        set((state) => ({ deck: state.deck.filter((_, i) => i !== index) })),

      replaceCardInDeck: (index, newCardId) =>
        set((state) => ({ deck: state.deck.map((id, i) => (i === index ? newCardId : id)) })),

      spendCredits: (amount) => {
        const state = get();
        if (state.credits < amount) return false;
        set({ credits: state.credits - amount });
        return true;
      },

      healPlayer: (amount) =>
        set((state) => ({
          player: { ...state.player, hp: Math.min(state.player.maxHp, state.player.hp + amount) },
        })),

      damagePlayer: (amount) =>
        set((state) => {
          const hp = Math.max(0, state.player.hp - amount);
          if (hp <= 0) {
            return { player: { ...state.player, hp: 0 }, screen: "runEnd", runOutcome: "defeat" };
          }
          return { player: { ...state.player, hp } };
        }),

      incrementRemovals: () => set((state) => ({ removalsUsed: state.removalsUsed + 1 })),

      completeNode: () =>
        set((state) => {
          const node = getMapNodeById(state.mapNodes, state.currentNodeId);
          const resolvedNodeIds = state.resolvedNodeIds.includes(node.id)
            ? state.resolvedNodeIds
            : [...state.resolvedNodeIds, node.id];
          if (node.next.length === 1) {
            return { resolvedNodeIds, currentNodeId: node.next[0], screen: "map" };
          }
          return { resolvedNodeIds, screen: "map" };
        }),

      choose: (nextId) => set({ currentNodeId: nextId, screen: "map" }),
      clearUiNotice: () => set({ uiNotice: null }),
    }),
    {
      name: RUN_SAVE_KEY,
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
    },
  ),
);
