import { useEffect, useState, type ReactNode } from "react";
import { get as idbGet } from "idb-keyval";
import { useRunStore, RUN_SAVE_KEY } from "./state/runStore";
import { useMetaStore } from "./state/metaStore";
import { MapScreen } from "./components/MapScreen";
import { CombatScreen } from "./components/CombatScreen";
import { RewardScreen } from "./components/RewardScreen";
import { ShopScreen } from "./components/ShopScreen";
import { RestScreen } from "./components/RestScreen";
import { EventScreen } from "./components/EventScreen";
import { RunEndScreen } from "./components/RunEndScreen";
import { SystemNotice } from "./components/SystemNotice";
import { playUiCue } from "./audio/uiCues";
import { VisualStyleSwitch, type VisualStyle } from "./components/VisualStyleSwitch";
import driftLogo from "./assets/brand/drift-logo.png";
import "./components/ScreenLayout.css";

type BootState = "checking" | "askContinue" | "ready";
type SavedRunSummary = {
  hp: number;
  maxHp: number;
  credits: number;
  deckSize: number;
  nodeLabel: string;
};

function App() {
  const [bootState, setBootState] = useState<BootState>("checking");
  const [savedSummary, setSavedSummary] = useState<SavedRunSummary | null>(null);
  const [selectedThreat, setSelectedThreat] = useState<number>(0);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(() => {
    const savedStyle = window.localStorage.getItem("drift-visual-style");
    return savedStyle === "pixel" ? "pixel" : "hud";
  });
  const screen = useRunStore((s) => s.screen);
  const notice = useRunStore((s) => s.uiNotice);
  const clearNotice = useRunStore((s) => s.clearUiNotice);
  const threatLevelsUnlocked = useMetaStore((s) => s.threatLevelsUnlocked);
  const showVisualSwitch = import.meta.env.DEV;

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
        setBootState("askContinue");
      } else {
        useRunStore.getState().startNewRun(0);
        setBootState("ready");
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.visualStyle = visualStyle;
    document.documentElement.dataset.styleSwitch = showVisualSwitch ? "on" : "off";
    window.localStorage.setItem("drift-visual-style", visualStyle);
  }, [showVisualSwitch, visualStyle]);

  useEffect(() => {
    if (!notice) return;
    playUiCue(notice.kind);
  }, [notice]);

  useEffect(() => {
    if (!notice || notice.sticky) return;
    const timeout = window.setTimeout(() => clearNotice(), 2800);
    return () => window.clearTimeout(timeout);
  }, [clearNotice, notice]);

  let content: ReactNode;
  if (bootState === "checking") {
    content = <div className="screen-layout">Загрузка…</div>;
  } else if (bootState === "askContinue") {
    content = (
      <div className="screen-layout">
        <h1 className="brand-title">
          <img className="brand-logo" src={driftLogo} alt="dRift" />
          <span>dRift</span>
        </h1>
        <p className="screen-hint">Найден сохранённый забег.</p>
        {savedSummary ? (
          <p className="screen-hint">
            Сектор <strong>{savedSummary.nodeLabel}</strong> · Корпус <strong>{savedSummary.hp}/{savedSummary.maxHp}</strong> ·
            Кредиты <strong>₡ {savedSummary.credits}</strong> · Протоколы <strong>{savedSummary.deckSize}</strong>
          </p>
        ) : null}
        <div className="rest-choices">
          <div className="rest-choice">
            <div className="card-name">Уровень угрозы</div>
            <div className="card-desc">
              {threatLevelsUnlocked ? "Выбери интенсивность системной нагрузки." : "Разблокируется после победы над Ядром-Стражем."}
            </div>
            <div className="deck-list">
              {(threatLevelsUnlocked ? [0, 1, 2, 3, 4, 5] : [0]).map((level) => (
                <button
                  aria-pressed={selectedThreat === level}
                  className={`threat-option${selectedThreat === level ? " active" : ""}`}
                  key={level}
                  onClick={() => setSelectedThreat(level)}
                  type="button"
                >
                  T{level}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={async () => {
            await useRunStore.persist.rehydrate();
            await useMetaStore.persist.rehydrate();
            setBootState("ready");
          }}
        >
          Продолжить забег
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            useRunStore.getState().startNewRun(selectedThreat);
            setBootState("ready");
          }}
        >
          Новый забег
        </button>
      </div>
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
      {showVisualSwitch ? <VisualStyleSwitch onChange={setVisualStyle} style={visualStyle} /> : null}
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
