import { CreditsIcon, HullIcon, ThreatIcon } from "../icons";
import { NODE_ICONS } from "../mapIcons";
import { RoomBackdrop } from "../RoomBackdrop";
import type { MapNodeType } from "../../types/run";
import { PixelMedallion, PixelPanel } from "./PixelChrome";
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

function nodeTypeLabel(type: string): string {
  if (type === "compartment") return "Отсек";
  if (type === "elite") return "Страж";
  if (type === "boss") return "Ядро-Страж";
  if (type === "shop") return "Терминал снабжения";
  if (type === "rest") return "Ремонтный отсек";
  if (type === "signal") return "Сигнал";
  return type;
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

      <PixelPanel className="pixel-map-header">
        <div className="pixel-map-title">
          <span className="screen-kicker">NAV // ASTROLABE</span>
          <h1>{title}</h1>
        </div>
        <div className="pixel-map-vitals">
          <PixelMedallion><HullIcon /> {playerHp}/{playerMaxHp}</PixelMedallion>
          <PixelMedallion><CreditsIcon /> ₡ {credits}</PixelMedallion>
          <PixelMedallion><ThreatIcon /> T{threatLevel}</PixelMedallion>
        </div>
      </PixelPanel>

      <p className="screen-hint">
        Контур забега: <strong>Протоколы {deckSize}</strong> · <strong>Модули {moduleCount}</strong> · <strong>Инъекторы {injectorCount}</strong>
      </p>

      <PixelPanel className="pixel-map-stage">
        <div aria-hidden="true" className="pixel-map-astrolabe-rings">
          <span />
          <span />
          <span />
        </div>
        {displayLayers.map((layer, layerIndex) => {
          const isFullyVisible = layerIndex <= currentLayerIndex + 1;
          return (
            <div className="pixel-map-layer" key={layerIndex}>
              <PixelMedallion className="pixel-map-layer-token">L{String(layerIndex + 1).padStart(2, "0")}</PixelMedallion>
              <div className="pixel-map-layer-nodes">
                {layer.map((nodeId) => {
                  if (!isFullyVisible) {
                    return (
                      <div className="pixel-map-node locked" key={nodeId} title="Пока неизвестно">
                        ?
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
                      {resolved ? <small>OK</small> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </PixelPanel>

      <PixelPanel className="pixel-map-context">
        {awaitingChoice ? (
          <>
            <p className="screen-hint">{showBranchHint ? "Подсказка: выбирай ветку с учётом ресурсов и состава колоды." : "Куда дальше?"}</p>
            <div className="pixel-map-choices">
              {currentNode.next.map((nextId) => {
                const nextNode = mapNodeById(mapNodes, nextId);
                return (
                  <button className="primary-button" key={nextId} onClick={() => onChoose(nextId)} type="button">
                    {NODE_ICONS[nextNode.type]} {nextNode.label}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="pixel-map-enter">
            <span className="action-label">Текущая точка // {nodeTypeLabel(currentNode.type)}</span>
            <button className="primary-button" onClick={onEnterNode} type="button">
              Войти: {currentNode.label} →
            </button>
          </div>
        )}
      </PixelPanel>
    </div>
  );
}
