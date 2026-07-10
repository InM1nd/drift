import { createElement, type ReactNode } from "react";
import type { MapNodeType } from "../types";
import { BossIcon, CompartmentIcon, EliteIcon, RestIcon, ShopIcon, SignalIcon } from "./icons";

export const NODE_ICONS: Record<MapNodeType, ReactNode> = {
  compartment: createElement(CompartmentIcon, { className: "map-icon" }),
  elite: createElement(EliteIcon, { className: "map-icon" }),
  signal: createElement(SignalIcon, { className: "map-icon" }),
  shop: createElement(ShopIcon, { className: "map-icon" }),
  rest: createElement(RestIcon, { className: "map-icon" }),
  boss: createElement(BossIcon, { className: "map-icon" }),
};
