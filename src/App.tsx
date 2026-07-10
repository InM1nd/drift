import { useEffect, useState, type ReactNode } from "react";
import { get as idbGet } from "idb-keyval";
import { useRunStore, RUN_SAVE_KEY } from "./state/runStore";
import { useMetaStore } from "./state/metaStore";
import { useSettingsStore } from "./state/settingsStore";
import { MapScreen } from "./components/MapScreen";
import { CombatScreen } from "./components/CombatScreen";
import { RewardScreen } from "./components/RewardScreen";
import { ShopScreen } from "./components/ShopScreen";
import { RestScreen } from "./components/RestScreen";
import { EventScreen } from "./components/EventScreen";
import { RunEndScreen } from "./components/RunEndScreen";
import { StartScreen, type SavedRunSummary } from "./components/StartScreen";
import { SystemNotice } from "./components/SystemNotice";
import { playUiCue } from "./audio/uiCues";
import "./components/ScreenLayout.css";

type BootState = "checking" | "start" | "ready";

function App() {
  const [bootState, setBootState] = useState<BootState>("checking");
  const [savedSummary, setSavedSummary] = useState<SavedRunSummary | null>(null);
  const screen = useRunStore((s) => s.screen);
  const notice = useRunStore((s) => s.uiNotice);
  const clearNotice = useRunStore((s) => s.clearUiNotice);
  const threatLevelsUnlocked = useMetaStore((s) => s.threatLevelsUnlocked);
  const atTitle = useSettingsStore((s) => s.atTitle);
  const setAtTitle = useSettingsStore((s) => s.setAtTitle);

  useEffect(() => {
    useMetaStore.persist.rehydrate();
    idbGet(RUN_SAVE_KEY).then((saved) => {
      if (saved) {
        try {
          const parsed = typeof saved === "string" ? JSON.parse(saved) : saved;
          const state = parsed?.state;
          if (state?.player && state?.deck && state?.mapNodes && state?.currentNodeId) {
            const node = state.mapNodes.find((item: { id: string; label: string }) => item.id === state.currentNodeId);
            setSavedSummary({
              hp: state.player.hp,
              maxHp: state.player.maxHp,
              credits: state.credits ?? 0,
              deckSize: state.deck.length,
              nodeLabel: node?.label ?? "Неизвестный сектор",
            });
          }
        } catch {
          setSavedSummary(null);
        }
      }
      setBootState("start");
    });
  }, []);

  useEffect(() => {
    if (!notice) return;
    playUiCue(notice.kind);
  }, [notice]);

  useEffect(() => {
    if (!notice || notice.sticky) return;
    const timeout = window.setTimeout(() => clearNotice(), 2800);
    return () => window.clearTimeout(timeout);
  }, [clearNotice, notice]);

  async function handleContinue() {
    if (bootState !== "ready") {
      await useRunStore.persist.rehydrate();
      await useMetaStore.persist.rehydrate();
      setBootState("ready");
    }
    setAtTitle(false);
  }

  function handleNewRun(threatLevel: number) {
    useRunStore.getState().startNewRun(threatLevel);
    setBootState("ready");
    setAtTitle(false);
  }

  let content: ReactNode;
  if (bootState === "checking") {
    content = <div className="screen-layout">Загрузка…</div>;
  } else if (bootState !== "ready" || atTitle) {
    content = (
      <StartScreen
        canContinue={bootState === "ready" || savedSummary !== null}
        onContinue={handleContinue}
        onNewRun={handleNewRun}
        savedSummary={savedSummary}
        threatLevelsUnlocked={threatLevelsUnlocked}
      />
    );
  } else {
    switch (screen) {
      case "combat":
        content = <CombatScreen />;
        break;
      case "reward":
        content = <RewardScreen />;
        break;
      case "shop":
        content = <ShopScreen />;
        break;
      case "rest":
        content = <RestScreen />;
        break;
      case "event":
        content = <EventScreen />;
        break;
      case "runEnd":
        content = <RunEndScreen />;
        break;
      case "map":
      default:
        content = <MapScreen />;
        break;
    }
  }

  return (
    <>
      {content}
      {notice ? (
        <SystemNotice
          actions={notice.sticky ? <button className="secondary-button" onClick={clearNotice} type="button">Скрыть</button> : undefined}
          kind={notice.kind}
          message={notice.text}
        />
      ) : null}
    </>
  );
}

export default App;
