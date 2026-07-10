import type { MapNodeType } from "../types";
import "./HudRoomBackdrop.css";

export type HudRoomKind = MapNodeType | "map" | "reward" | "run-end";

interface HudRoomBackdropProps {
  kind: HudRoomKind;
  seed?: string;
}

function variantFromSeed(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 3;
}

export function HudRoomBackdrop({ kind, seed = kind }: HudRoomBackdropProps) {
  const variant = variantFromSeed(seed);

  return (
    <div aria-hidden="true" className={`hud-room-backdrop room-${kind} room-variant-${variant}`}>
      <svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 1200 720">
        <g className="room-shell">
          <path d="M70 650 365 382h470l295 268" />
          <path d="M155 650 410 430h380l255 220" />
          <path d="M0 650h1200M365 382 210 90M835 382 990 90" />
          <path d="M410 430 330 90M790 430 870 90" />
          <path d="M210 90h780M330 90h540" />
          <path d="M600 90v560M70 650h1060" />
        </g>

        <g className="room-bulkheads">
          <path d="M94 650V182l116-92h120l80 340-255 220Z" />
          <path d="M1106 650V182l-116-92H870l-80 340 255 220Z" />
          <path d="M444 430V210l62-58h188l62 58v220" />
          <path d="M484 430V240l44-42h144l44 42v190" />
        </g>

        <g className="room-panels">
          <path d="M132 228h104l40 122H132Z" />
          <path d="M1068 228H964l-40 122h144Z" />
          <path d="M154 390h132l30 96H154Z" />
          <path d="M1046 390H914l-30 96h162Z" />
        </g>

        {kind === "compartment" && variant === 0 ? (
          <g className="room-cargo">
            <path d="M438 526h126v106H438Zm198 0h126v106H636Z" />
            <path d="M454 544h94m104 0h94M501 526v106m198-106v106" />
          </g>
        ) : null}

        {kind === "compartment" && variant === 1 ? (
          <g className="room-lab">
            <path d="M458 224h96v210h-96Zm188 0h96v210h-96Z" />
            <path d="M474 254h64v142h-64Zm188 0h64v142h-64Z" />
            <path d="M506 276c-24 18-24 74 0 96 24-22 24-78 0-96Zm188 18c-22 12-22 54 0 70 22-16 22-58 0-70Z" />
            <path d="M458 458h284v62H458Z" />
          </g>
        ) : null}

        {kind === "compartment" && variant === 2 ? (
          <g className="room-airlock">
            <circle cx="600" cy="318" r="152" />
            <circle cx="600" cy="318" r="118" />
            <path d="M600 166v304M448 318h304M492 210l216 216M708 210 492 426" />
            <path d="M530 494h140m-122 24h104m-84 24h64" />
          </g>
        ) : null}

        {kind === "elite" ? (
          <g className="room-elite">
            <path d="m600 152 94 54 0 108-94 54-94-54V206Z" />
            <path d="m600 188 62 36v72l-62 36-62-36v-72Z" />
            <path d="M600 152v216M506 206l188 108M694 206 506 314" />
          </g>
        ) : null}

        {kind === "boss" || kind === "run-end" ? (
          <g className="room-core">
            <circle cx="600" cy="278" r="148" />
            <circle cx="600" cy="278" r="104" />
            <circle cx="600" cy="278" r="48" />
            <path d="M600 104v70m0 208v72M426 278h70m208 0h70" />
            <path d="m600 230 42 24v48l-42 24-42-24v-48Z" />
          </g>
        ) : null}

        {kind === "signal" ? (
          <g className="room-signal">
            <path d="M420 286h72l28-72 52 152 44-112 36 68h128" />
            <path d="M600 420V286m-76 134h152" />
            <circle cx="600" cy="286" r="164" />
          </g>
        ) : null}

        {kind === "shop" ? (
          <g className="room-terminal">
            <path d="M452 178h296v238H452Z" />
            <path d="M484 214h232v120H484Zm0 154h94m34 0h104" />
            <path d="m552 416-30 112h156l-30-112" />
          </g>
        ) : null}

        {kind === "rest" ? (
          <g className="room-maintenance">
            <circle cx="600" cy="286" r="122" />
            <path d="M600 214v144m-72-72h144" />
            <path d="M454 454h292M486 454l-28 112m256-112 28 112" />
          </g>
        ) : null}

        {kind === "map" ? (
          <g className="room-route">
            <path d="M424 510 520 398l80 42 96-138 82-82" />
            <circle cx="424" cy="510" r="10" />
            <circle cx="520" cy="398" r="10" />
            <circle cx="600" cy="440" r="10" />
            <circle cx="696" cy="302" r="10" />
            <circle cx="778" cy="220" r="16" />
          </g>
        ) : null}

        {kind === "reward" ? (
          <g className="room-recovery">
            <path d="M456 190h288v210H456Z" />
            <path d="M490 228h220M490 270h154M490 312h190" />
            <path d="m600 450 70 40-70 40-70-40Z" />
          </g>
        ) : null}

        <g className="room-corrosion">
          <circle cx="280" cy="520" r="68" />
          <circle cx="330" cy="558" r="34" />
          <circle cx="930" cy="190" r="46" />
          <path d="M220 650c34-96 118-124 184-78 44 30 82 30 118 4" />
        </g>
      </svg>
      <div className="room-depth-haze" />
      <div className="room-scan-sweep" />
    </div>
  );
}
