import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VisualStyle } from "../components/VisualStyleSwitch";

export const SETTINGS_SAVE_KEY = "drift-settings-v1";

interface SettingsState {
  visualStyle: VisualStyle;
  /** Показать стартовый экран поверх текущего рана (пункт "Главное меню" в GameMenu) — не переживает перезагрузку. */
  atTitle: boolean;
}

interface SettingsActions {
  setVisualStyle: (style: VisualStyle) => void;
  setAtTitle: (atTitle: boolean) => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      visualStyle: "hud",
      atTitle: false,
      setVisualStyle: (visualStyle) => set({ visualStyle }),
      setAtTitle: (atTitle) => set({ atTitle }),
    }),
    {
      name: SETTINGS_SAVE_KEY,
      partialize: (state) => ({ visualStyle: state.visualStyle }),
    },
  ),
);
