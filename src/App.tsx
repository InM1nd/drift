import { useEffect, useState } from "react";
import { get as idbGet } from "idb-keyval";
import { useRunStore, RUN_SAVE_KEY } from "./state/runStore";
import { MapScreen } from "./components/MapScreen";
import { CombatScreen } from "./components/CombatScreen";
import { RewardScreen } from "./components/RewardScreen";
import { ShopScreen } from "./components/ShopScreen";
import { RestScreen } from "./components/RestScreen";
import { EventScreen } from "./components/EventScreen";
import { RunEndScreen } from "./components/RunEndScreen";
import "./components/ScreenLayout.css";

type BootState = "checking" | "askContinue" | "ready";

function App() {
  const [bootState, setBootState] = useState<BootState>("checking");
  const screen = useRunStore((s) => s.screen);

  useEffect(() => {
    idbGet(RUN_SAVE_KEY).then((saved) => {
      if (saved) {
        setBootState("askContinue");
      } else {
        useRunStore.getState().startNewRun();
        setBootState("ready");
      }
    });
  }, []);

  if (bootState === "checking") {
    return <div className="screen-layout">Загрузка…</div>;
  }

  if (bootState === "askContinue") {
    return (
      <div className="screen-layout">
        <h1>ДРЕЙФ</h1>
        <p className="screen-hint">Найден сохранённый забег.</p>
        <button
          type="button"
          className="primary-button"
          onClick={async () => {
            await useRunStore.persist.rehydrate();
            setBootState("ready");
          }}
        >
          Продолжить забег
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            useRunStore.getState().startNewRun();
            setBootState("ready");
          }}
        >
          Новый забег
        </button>
      </div>
    );
  }

  switch (screen) {
    case "combat":
      return <CombatScreen />;
    case "reward":
      return <RewardScreen />;
    case "shop":
      return <ShopScreen />;
    case "rest":
      return <RestScreen />;
    case "event":
      return <EventScreen />;
    case "runEnd":
      return <RunEndScreen />;
    case "map":
    default:
      return <MapScreen />;
  }
}

export default App;
