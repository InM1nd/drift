import { useEffect, useState } from "react";
import { useRunStore } from "../state/runStore";
import { getMapNodeById } from "../data/mapNodes";
import { GameMenu } from "./GameMenu";
import { PixelMapLayout } from "./pixel/PixelMapLayout";
import "./ScreenLayout.css";

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
    <>
      <PixelMapLayout
        awaitingChoice={awaitingChoice}
        credits={credits}
        currentLayerIndex={currentLayerIndex}
        currentNode={currentNode}
        currentNodeId={currentNodeId}
        deckSize={deckSize}
        displayLayers={displayLayers}
        injectorCount={injectorCount}
        mapNodes={mapNodes}
        moduleCount={moduleCount}
        onChoose={choose}
        onEnterNode={enterNode}
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        resolvedNodeIds={resolvedNodeIds}
        showBranchHint={showBranchHint}
        threatLevel={threatLevel}
        title="dRift · Остов «Хорда»"
      />
      <GameMenu />
    </>
  );
}
