import { useRunStore } from "../state/runStore";
import { getMapNodeById } from "../data/mapNodes";
import "./ScreenLayout.css";

const NODE_ICONS: Record<string, string> = {
  compartment: "⬡",
  elite: "◆",
  signal: "◈",
  shop: "$",
  rest: "+",
  boss: "☠",
};

export function MapScreen() {
  const mapNodes = useRunStore((s) => s.mapNodes);
  const displayLayers = useRunStore((s) => s.displayLayers);
  const currentNodeId = useRunStore((s) => s.currentNodeId);
  const resolvedNodeIds = useRunStore((s) => s.resolvedNodeIds);
  const credits = useRunStore((s) => s.credits);
  const playerHp = useRunStore((s) => s.player.hp);
  const playerMaxHp = useRunStore((s) => s.player.maxHp);
  const enterNode = useRunStore((s) => s.enterNode);
  const choose = useRunStore((s) => s.choose);

  const currentNode = getMapNodeById(mapNodes, currentNodeId);
  const isResolved = resolvedNodeIds.includes(currentNodeId);
  const awaitingChoice = isResolved && currentNode.next.length > 1;
  // "Следующий слой виден полностью, дальше — частично" (docs/06-map.md).
  const currentLayerIndex = displayLayers.findIndex((layer) => layer.includes(currentNodeId));

  return (
    <div className="screen-layout">
      <h1>ДРЕЙФ · Остов «Хорда»</h1>
      <div className="player-status">
        <span>HP {playerHp}/{playerMaxHp}</span>
        <span className="credits-bar">₡ {credits}</span>
      </div>

      <div className="map-track">
        {displayLayers.map((layer, i) => {
          const isFullyVisible = i <= currentLayerIndex + 1;
          return (
            <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
              {layer.map((nodeId) => {
                if (!isFullyVisible) {
                  return (
                    <div key={nodeId} className="map-node locked" style={{ flex: 1 }} title="Пока неизвестно">
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
                  <div key={nodeId} className={className} style={{ flex: 1 }}>
                    {NODE_ICONS[node.type]} {node.label}
                    {resolved ? " ✓" : ""}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {awaitingChoice ? (
        <>
          <p className="screen-hint">Куда дальше?</p>
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
        </>
      ) : (
        <button type="button" className="primary-button" onClick={enterNode}>
          Войти: {currentNode.label} →
        </button>
      )}
    </div>
  );
}
