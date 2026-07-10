import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

// Отдельный от runStore ключ/стор: разблокировка Уровня угрозы (docs/11-threat-level.md)
// должна пережить startNewRun (тот пересоздаёт весь RunState с нуля) — здесь
// живёт то немногое, что переживает конкретный забег.
export const META_SAVE_KEY = "drift-meta-v1";

interface MetaState {
  threatLevelsUnlocked: boolean;
}

interface MetaActions {
  unlockThreatLevels: () => void;
}

type MetaStore = MetaState & MetaActions;

const idbStorage: StateStorage = {
  getItem: async (name) => (await idbGet(name)) ?? null,
  setItem: async (name, value) => {
    await idbSet(name, value);
  },
  removeItem: async (name) => {
    await idbDel(name);
  },
};

export const useMetaStore = create<MetaStore>()(
  persist(
    (set) => ({
      threatLevelsUnlocked: false,
      unlockThreatLevels: () => set({ threatLevelsUnlocked: true }),
    }),
    {
      name: META_SAVE_KEY,
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
    },
  ),
);
