import { createElement, type ReactNode } from "react";
import type { MapNodeType } from "../types";
import {
  BossIcon,
  CompartmentIcon,
  EliteIcon,
  PixelBossGlyph,
  PixelCompartmentGlyph,
  PixelEliteGlyph,
  PixelRestGlyph,
  PixelShopGlyph,
  PixelSignalGlyph,
  RestIcon,
  ShopIcon,
  SignalIcon,
} from "./icons";

function nodeIconPair(LineIcon: () => ReactNode, PixelIcon: () => ReactNode) {
  return createElement("span", { className: "map-icon-stack" }, LineIcon(), PixelIcon());
}

export const NODE_ICONS: Record<MapNodeType, ReactNode> = {
  compartment: nodeIconPair(
    () => createElement(CompartmentIcon, { className: "map-icon map-icon-line" }),
    () => createElement(PixelCompartmentGlyph, { className: "map-icon map-icon-pixel" }),
  ),
  elite: nodeIconPair(
    () => createElement(EliteIcon, { className: "map-icon map-icon-line" }),
    () => createElement(PixelEliteGlyph, { className: "map-icon map-icon-pixel" }),
  ),
  signal: nodeIconPair(
    () => createElement(SignalIcon, { className: "map-icon map-icon-line" }),
    () => createElement(PixelSignalGlyph, { className: "map-icon map-icon-pixel" }),
  ),
  shop: nodeIconPair(
    () => createElement(ShopIcon, { className: "map-icon map-icon-line" }),
    () => createElement(PixelShopGlyph, { className: "map-icon map-icon-pixel" }),
  ),
  rest: nodeIconPair(
    () => createElement(RestIcon, { className: "map-icon map-icon-line" }),
    () => createElement(PixelRestGlyph, { className: "map-icon map-icon-pixel" }),
  ),
  boss: nodeIconPair(
    () => createElement(BossIcon, { className: "map-icon map-icon-line" }),
    () => createElement(PixelBossGlyph, { className: "map-icon map-icon-pixel" }),
  ),
};
