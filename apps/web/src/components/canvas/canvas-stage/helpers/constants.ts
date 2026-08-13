import type { StickyColor } from "@educatio/shared";
import type { Viewport } from "./types";

export const MIN_SCALE = 0.2;
export const MAX_SCALE = 4;
export const ZOOM_INTENSITY = 0.0015;
export const GRID_SIZE = 24;

export const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, scale: 1 };

export const CANVAS_FONT = "Inter, ui-sans-serif, system-ui, sans-serif";
export const CANVAS_MONO_FONT =
  "JetBrains Mono, ui-monospace, SFMono-Regular, monospace";

export const STICKY_TOKEN: Record<StickyColor, string> = {
  yellow: "--sticky-yellow",
  pink: "--sticky-pink",
  blue: "--sticky-blue",
  green: "--sticky-green",
  purple: "--sticky-purple",
};

export const STICKY_PADDING = 14;
export const CODE_PADDING = 12;

export const DRAG_SYNC_MS = 50;
export const SELECTION_PADDING = 6;
