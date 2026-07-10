import bossBackdrop from "../assets/pixel/boss.png";
import compartmentABackdrop from "../assets/pixel/compartment-a.png";
import compartmentBBackdrop from "../assets/pixel/compartment-b.png";
import compartmentCBackdrop from "../assets/pixel/compartment-c.png";
import eliteBackdrop from "../assets/pixel/elite.png";
import mapBackdrop from "../assets/pixel/map.png";
import restBackdrop from "../assets/pixel/rest.png";
import rewardBackdrop from "../assets/pixel/reward.png";
import runEndDefeatBackdrop from "../assets/pixel/run-end-defeat.png";
import runEndVictoryBackdrop from "../assets/pixel/run-end-victory.png";
import shopBackdrop from "../assets/pixel/shop.png";
import signalBackdrop from "../assets/pixel/signal.png";
import type { MapNodeType } from "../types";
import "./PixelRoomBackdrop.css";

export type RoomKind = MapNodeType | "map" | "reward" | "run-end";

interface PixelRoomBackdropProps {
  kind: RoomKind;
  seed?: string;
}

const COMPARTMENT_VARIANTS = [compartmentABackdrop, compartmentBBackdrop, compartmentCBackdrop];

function variantFromSeed(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % COMPARTMENT_VARIANTS.length;
}

function resolveBackdrop(kind: RoomKind, seed: string): string {
  if (kind === "compartment") return COMPARTMENT_VARIANTS[variantFromSeed(seed)];
  if (kind === "map") return mapBackdrop;
  if (kind === "elite") return eliteBackdrop;
  if (kind === "boss") return bossBackdrop;
  if (kind === "signal") return signalBackdrop;
  if (kind === "shop") return shopBackdrop;
  if (kind === "rest") return restBackdrop;
  if (kind === "reward") return rewardBackdrop;
  if (kind === "run-end") return seed.includes("defeat") ? runEndDefeatBackdrop : runEndVictoryBackdrop;
  return compartmentABackdrop;
}

export function PixelRoomBackdrop({ kind, seed = kind }: PixelRoomBackdropProps) {
  const source = resolveBackdrop(kind, seed);

  return (
    <div aria-hidden="true" className={`pixel-room-backdrop pixel-room-${kind}`}>
      <img alt="" className="pixel-room-image" src={source} />
      <div className="pixel-room-atmo" />
    </div>
  );
}
