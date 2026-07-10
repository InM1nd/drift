import { useState } from "react";
import driftPixelLogo from "../assets/brand/drift-logo-pixel.png";
import { RoomBackdrop } from "./RoomBackdrop";
import { SettingsPanel } from "./SettingsPanel";
import { PixelStartLayout } from "./pixel/PixelStartLayout";
import "./ScreenLayout.css";
import "./StartScreen.css";

export interface SavedRunSummary {
  hp: number;
  maxHp: number;
  credits: number;
  deckSize: number;
  nodeLabel: string;
}

interface StartScreenProps {
  canContinue: boolean;
  savedSummary: SavedRunSummary | null;
  threatLevelsUnlocked: boolean;
  onContinue: () => void;
  onNewRun: (threatLevel: number) => void;
}

export function StartScreen({ canContinue, savedSummary, threatLevelsUnlocked, onContinue, onNewRun }: StartScreenProps) {
  const [selectedThreat, setSelectedThreat] = useState(0);
  const [view, setView] = useState<"menu" | "settings">("menu");

  if (view === "menu") {
    return (
      <PixelStartLayout
        canContinue={canContinue}
        onContinue={onContinue}
        onNewRun={() => onNewRun(selectedThreat)}
        onOpenSettings={() => setView("settings")}
        onSelectThreat={setSelectedThreat}
        savedSummary={savedSummary}
        selectedThreat={selectedThreat}
        threatLevelsUnlocked={threatLevelsUnlocked}
      />
    );
  }

  return (
    <div className="screen-layout start-screen">
      <RoomBackdrop kind="map" />
      <h1 className="brand-title">
        <img className="brand-logo-pixel" src={driftPixelLogo} alt="dRift" />
      </h1>

      <SettingsPanel />
      <button className="secondary-button" onClick={() => setView("menu")} type="button">
        Назад
      </button>
    </div>
  );
}
