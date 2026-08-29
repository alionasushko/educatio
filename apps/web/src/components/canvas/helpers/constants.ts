import type { ShapeKind, StickyColor } from "@educatio/shared";
import type { CanvasSettings } from "./types";

export const STICKY_TOKEN: Record<StickyColor, string> = {
  yellow: "--sticky-yellow",
  pink: "--sticky-pink",
  blue: "--sticky-blue",
  green: "--sticky-green",
  purple: "--sticky-purple",
};

export const STICKY_ORDER: StickyColor[] = [
  "yellow",
  "pink",
  "blue",
  "green",
  "purple",
];

export const SHAPE_ORDER: ShapeKind[] = ["rectangle", "circle", "arrow"];

export const SHAPE_LABEL: Record<ShapeKind, string> = {
  rectangle: "Rectangle",
  circle: "Circle",
  arrow: "Arrow",
};

export interface InkColor {
  token: string;
  label: string;
}

export const INK_FALLBACK = "--text-primary";

export const INK_COLORS: InkColor[] = [
  { token: "--text-primary", label: "Ink" },
  { token: "--accent-brand", label: "Indigo" },
  { token: "--accent-rust", label: "Rust" },
  { token: "--avatar-3", label: "Olive" },
  { token: "--avatar-5", label: "Teal" },
  { token: "--avatar-6", label: "Crimson" },
];

export interface StrokeOption {
  width: number;
  label: string;
}

export const STROKE_WIDTHS: StrokeOption[] = [
  { width: 2, label: "Thin" },
  { width: 4, label: "Medium" },
  { width: 8, label: "Thick" },
];

export const DEFAULT_SETTINGS: CanvasSettings = {
  tool: "select",
  inkToken: "--text-primary",
  stickyColor: "yellow",
  shape: "rectangle",
  strokeWidth: 4,
};
