import { createElement, type ReactNode } from "react";
import type { Status } from "../types";
import {
  BreachIcon,
  CorrosionIcon,
  JammingIcon,
  OverdriveIcon,
  ReflectIcon,
  StabilizationIcon,
} from "./icons";

export const STATUS_ICONS: Record<Status, ReactNode> = {
  corrosion: createElement(CorrosionIcon, { className: "status-icon" }),
  overdrive: createElement(OverdriveIcon, { className: "status-icon" }),
  stabilization: createElement(StabilizationIcon, { className: "status-icon" }),
  jamming: createElement(JammingIcon, { className: "status-icon" }),
  breach: createElement(BreachIcon, { className: "status-icon" }),
  reflect: createElement(ReflectIcon, { className: "status-icon" }),
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
