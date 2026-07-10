import { CreditsIcon, HullIcon, ThreatIcon } from "../icons";
import { NODE_ICONS } from "../mapIcons";
import { RoomBackdrop } from "../RoomBackdrop";
import type { MapNodeType } from "../../types/run";
import "./PixelLayout.css";

interface PixelMapNode {
  id: string;
  label: string;
  type: MapNodeType;
  next: string[];
}

interface PixelMapLayoutProps {
  title: string;
  mapNodes: PixelMapNode[];
  displayLayers: string[][];
  currentNode: PixelMapNode;
  currentLayerIndex: number;
  currentNodeId: string;
  resolvedNodeIds: string[];
  awaitingChoice: boolean;
  showBranchHint: boolean;
  playerHp: number;
  playerMaxHp: number;
  credits: number;
  threatLevel: number;
  deckSize: number;
  moduleCount: number;
  injectorCount: number;
  onChoose: (nodeId: string) => void;
  onEnterNode: () => void;
}

function mapNodeById(mapNodes: PixelMapNode[], id: string): PixelMapNode {
  const node = mapNodes.find((item) => item.id === id);
  return node ?? mapNodes[0];
}

export function PixelMapLayout({
  title,
  mapNodes,
  displayLayers,
  currentNode,
  currentLayerIndex,
  currentNodeId,
  resolvedNodeIds,
  awaitingChoice,
  showBranchHint,
  playerHp,
  playerMaxHp,
  credits,
  threatLevel,
  deckSize,
  moduleCount,
  injectorCount,
  onChoose,
  onEnterNode,
}: PixelMapLayoutProps) {
  return (
    <div className="screen-layout map-screen pixel-map-screen">
      <RoomBackdrop kind="map" seed={currentNode.id} />

      <header className="pixel-map-header">
        <div className="pixel-map-title">
          <span className="screen-kicker">NAV // ASTROLABE</span>
          <h1>{title}</h1>
        </div>
        <div className="pixel-map-vitals">
          <span><HullIcon /><strong>{playerHp}/{playerMaxHp}</strong></span>
          <span><CreditsIcon /><strong>₡ {credits}</strong></span>
          <span><ThreatIcon /><strong>T{threatLevel}</strong></span>
        </div>
        <div className="pixel-map-manifest" aria-label="Состав забега">
          <span>Протоколы <strong>{deckSize}</strong></span>
          <span>Модули <strong>{moduleCount}</strong></span>
          <span>Инъекторы <strong>{injectorCount}</strong></span>
        </div>
      </header>

      <section className={`pixel-map-stage pixel-map-stage-${displayLayers.length}`}>
        <div aria-hidden="true" className="pixel-map-astrolabe-rings">
          <span />
          <span />
          <span />
        </div>
        <div className="pixel-map-route">
          {displayLayers.map((layer, layerIndex) => {
            const isFullyVisible = layerIndex <= currentLayerIndex + 1;
            return (
              <div className="pixel-map-layer" key={layerIndex}>
                <div className="pixel-map-layer-token">
                  <span>L{String(layerIndex + 1).padStart(2, "0")}</span>
                </div>
                <div className="pixel-map-layer-nodes">
                  {layer.map((nodeId) => {
                    if (!isFullyVisible) {
                      return (
                        <div className="pixel-map-node locked" key={nodeId} title="Пока неизвестно">
                          <span aria-hidden="true">?</span>
                          <small>Неизвестно</small>
                        </div>
                      );
                    }

                    const node = mapNodeById(mapNodes, nodeId);
                    const resolved = resolvedNodeIds.includes(nodeId);
                    const isCurrent = nodeId === currentNodeId;
                    const isChoice = awaitingChoice && currentNode.next.includes(nodeId);
                    const classes = [
                      "pixel-map-node",
                      resolved ? "resolved" : "",
                      isCurrent && !awaitingChoice ? "current" : "",
                      isChoice ? "choice" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div className={classes} key={nodeId}>
                        <span className="pixel-map-node-icon">{NODE_ICONS[node.type]}</span>
                        <span className="pixel-map-node-label">{node.label}</span>
                        {resolved ? <small>Пройдено</small> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="pixel-map-context">
        {awaitingChoice ? (
          <div className="pixel-map-choices" aria-label={showBranchHint ? "Выбери ветку с учётом ресурсов и состава колоды" : "Выбери следующий узел"}>
            {currentNode.next.map((nextId) => {
              const nextNode = mapNodeById(mapNodes, nextId);
              return (
                <button className="primary-button pixel-map-action" key={nextId} onClick={() => onChoose(nextId)} type="button">
                  {NODE_ICONS[nextNode.type]} {nextNode.label}
                </button>
              );
            })}
          </div>
        ) : (
          <button className="primary-button pixel-map-action" onClick={onEnterNode} type="button">
            Войти: {currentNode.label} →
          </button>
        )}
      </div>
    </div>
  );
}
