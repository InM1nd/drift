import { useEffect, useState } from "react";
import { useRunStore } from "../state/runStore";
import { getMapNodeById } from "../data/mapNodes";
import { GameMenu } from "./GameMenu";
import { HudRoomBackdrop } from "./HudRoomBackdrop";
import { CreditsIcon, HullIcon, ThreatIcon } from "./icons";
import { NODE_ICONS } from "./mapIcons";
import { ScreenHeader } from "./ScreenHeader";
import "./ScreenLayout.css";

const NODE_TYPE_LABELS: Record<string, string> = {
  compartment: "Отсек",
  elite: "Страж",
  boss: "Ядро-Страж",
  shop: "Терминал снабжения",
  rest: "Ремонтный отсек",
  signal: "Сигнал",
};

export function MapScreen() {
  const mapNodes = useRunStore((s) => s.mapNodes);
  const displayLayers = useRunStore((s) => s.displayLayers);
  const currentNodeId = useRunStore((s) => s.currentNodeId);
  const resolvedNodeIds = useRunStore((s) => s.resolvedNodeIds);
  const credits = useRunStore((s) => s.credits);
  const playerHp = useRunStore((s) => s.player.hp);
  const playerMaxHp = useRunStore((s) => s.player.maxHp);
  const deckSize = useRunStore((s) => s.deck.length);
  const moduleCount = useRunStore((s) => s.ownedModuleIds.length);
  const injectorCount = useRunStore((s) => s.injectorIds.length);
  const threatLevel = useRunStore((s) => s.threatLevel);
  const enterNode = useRunStore((s) => s.enterNode);
  const choose = useRunStore((s) => s.choose);
  const [showBranchHint, setShowBranchHint] = useState(false);

  const currentNode = getMapNodeById(mapNodes, currentNodeId);
  const isResolved = resolvedNodeIds.includes(currentNodeId);
  const awaitingChoice = isResolved && currentNode.next.length > 1;
  // "Следующий слой виден полностью, дальше — частично" (docs/06-map.md).
  const currentLayerIndex = displayLayers.findIndex((layer) => layer.includes(currentNodeId));

  useEffect(() => {
    if (!awaitingChoice) return;
    if (window.localStorage.getItem("drift-hint-branch-seen")) return;
    setShowBranchHint(true);
    window.localStorage.setItem("drift-hint-branch-seen", "1");
  }, [awaitingChoice]);

  return (
    <div className="screen-layout map-screen">
      <HudRoomBackdrop kind="map" seed={currentNode.id} />
      <ScreenHeader
        code="NAV // ROUTE SCAN"
        title="ДРЕЙФ · Остов «Хорда»"
        aside={(
          <div className="screen-resources">
            <span><small><HullIcon /> Корпус</small>{playerHp}/{playerMaxHp}</span>
            <span className="credits-bar"><small><CreditsIcon /> Кредиты</small>₡ {credits}</span>
            <span><small><ThreatIcon /> Угроза</small>T{threatLevel}</span>
          </div>
        )}
      />
      <p className="screen-hint">
        Контур забега: <strong>Протоколы {deckSize}</strong> · <strong>Модули {moduleCount}</strong> · <strong>Инъекторы {injectorCount}</strong>
      </p>

      <div className="map-track">
        {displayLayers.map((layer, i) => {
          const isFullyVisible = i <= currentLayerIndex + 1;
          return (
            <div key={i} className="map-layer">
              <span className="layer-index">L{String(i + 1).padStart(2, "0")}</span>
              {layer.map((nodeId) => {
                if (!isFullyVisible) {
                  return (
                    <div key={nodeId} className="map-node locked" title="Пока неизвестно">
                      ?
                    </div>
                  );
                }
                const node = getMapNodeById(mapNodes, nodeId);
                const resolved = resolvedNodeIds.includes(nodeId);
                const isCurrent = nodeId === currentNodeId;
                const isChoosable = awaitingChoice && currentNode.next.includes(nodeId);
                const className = [
                  "map-node",
                  resolved ? "resolved" : "",
                  isCurrent && !awaitingChoice ? "current" : "",
                  isChoosable ? "choice current" : "",
                ].join(" ");
                return (
                  <div key={nodeId} className={className}>
                    {NODE_ICONS[node.type]} <span>{node.label}</span>
                    {resolved ? <span className="node-state">OK</span> : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="map-legend">
        <span>{NODE_ICONS.compartment} Отсек</span>
        <span>{NODE_ICONS.elite} Страж</span>
        <span>{NODE_ICONS.shop} Терминал</span>
        <span>{NODE_ICONS.rest} Ремонт</span>
        <span>{NODE_ICONS.signal} Сигнал</span>
        <span>{NODE_ICONS.boss} Ядро</span>
      </div>

      {awaitingChoice ? (
        <div className="screen-actions">
          <p className="screen-hint">
            {showBranchHint ? "Подсказка: выбирай ветку с учётом ресурсов и состава колоды." : "Куда дальше?"}
          </p>
          <div className="reward-grid">
            {currentNode.next.map((nextId) => {
              const next = getMapNodeById(mapNodes, nextId);
              return (
                <button key={nextId} type="button" className="primary-button" onClick={() => choose(nextId)}>
                  {NODE_ICONS[next.type]} {next.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="screen-actions">
          <span className="action-label">Текущая точка // {NODE_TYPE_LABELS[currentNode.type] ?? currentNode.type}</span>
          <button type="button" className="primary-button" onClick={enterNode}>
            Войти: {currentNode.label} →
          </button>
        </div>
      )}

      <GameMenu />
    </div>
  );
}
