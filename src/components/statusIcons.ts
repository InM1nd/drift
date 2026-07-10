import { createElement, type ReactNode } from "react";
import type { Status } from "../types";
import {
  BreachIcon,
  CorrosionIcon,
  JammingIcon,
  OverdriveIcon,
  PixelBreachGlyph,
  PixelCorrosionGlyph,
  PixelJammingGlyph,
  PixelOverdriveGlyph,
  PixelReflectGlyph,
  PixelStabilizationGlyph,
  ReflectIcon,
  StabilizationIcon,
} from "./icons";

function statusIconPair(LineIcon: () => ReactNode, PixelIcon: () => ReactNode) {
  return createElement("span", { className: "status-icon-stack" }, LineIcon(), PixelIcon());
}

export const STATUS_ICONS: Record<Status, ReactNode> = {
  corrosion: statusIconPair(
    () => createElement(CorrosionIcon, { className: "status-icon status-icon-line" }),
    () => createElement(PixelCorrosionGlyph, { className: "status-icon status-icon-pixel" }),
  ),
  overdrive: statusIconPair(
    () => createElement(OverdriveIcon, { className: "status-icon status-icon-line" }),
    () => createElement(PixelOverdriveGlyph, { className: "status-icon status-icon-pixel" }),
  ),
  stabilization: statusIconPair(
    () => createElement(StabilizationIcon, { className: "status-icon status-icon-line" }),
    () => createElement(PixelStabilizationGlyph, { className: "status-icon status-icon-pixel" }),
  ),
  jamming: statusIconPair(
    () => createElement(JammingIcon, { className: "status-icon status-icon-line" }),
    () => createElement(PixelJammingGlyph, { className: "status-icon status-icon-pixel" }),
  ),
  breach: statusIconPair(
    () => createElement(BreachIcon, { className: "status-icon status-icon-line" }),
    () => createElement(PixelBreachGlyph, { className: "status-icon status-icon-pixel" }),
  ),
  reflect: statusIconPair(
    () => createElement(ReflectIcon, { className: "status-icon status-icon-line" }),
    () => createElement(PixelReflectGlyph, { className: "status-icon status-icon-pixel" }),
  ),
};

export const STATUS_LABELS: Record<Status, string> = {
  corrosion: "Коррозия",
  overdrive: "Форсаж",
  stabilization: "Стабилизация",
  jamming: "Помехи",
  breach: "Пробоина",
  reflect: "Отражение",
};

export const STATUS_DESCRIPTIONS: Record<Status, string> = {
  corrosion: "Периодический урон в начале хода.",
  overdrive: "Усиливает агрессивные протоколы этого боя.",
  stabilization: "Повышает устойчивость и контроль урона.",
  jamming: "Снижает эффективность действий цели.",
  breach: "Ослабляет защиту и делает попадания больнее.",
  reflect: "Возвращает часть входящего урона источнику.",
};
