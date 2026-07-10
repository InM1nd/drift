import { create } from "zustand";
import { persist } from "zustand/middleware";

export const SETTINGS_SAVE_KEY = "drift-settings-v1";

interface SettingsState {
  /** Показать стартовый экран поверх текущего рана (пункт "Главное меню" в GameMenu) — не переживает перезагрузку. */
  atTitle: boolean;
}

interface SettingsActions {
  setAtTitle: (atTitle: boolean) => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      atTitle: false,
      setAtTitle: (atTitle) => set({ atTitle }),
    }),
    {
      name: SETTINGS_SAVE_KEY,
      partialize: () => ({}),
    },
  ),
);
