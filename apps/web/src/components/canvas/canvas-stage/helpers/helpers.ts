import { MAX_SCALE, MIN_SCALE } from "./constants";
import type { Viewport } from "./types";

export const clampScale = (scale: number): number =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

export const zoomAt = (
  viewport: Viewport,
  pointerX: number,
  pointerY: number,
  factor: number,
): Viewport => {
  const scale = clampScale(viewport.scale * factor);
  const ratio = scale / viewport.scale;
  return {
    scale,
    x: pointerX - (pointerX - viewport.x) * ratio,
    y: pointerY - (pointerY - viewport.y) * ratio,
  };
};

export const panBy = (
  viewport: Viewport,
  dx: number,
  dy: number,
): Viewport => ({
  ...viewport,
  x: viewport.x + dx,
  y: viewport.y + dy,
});

const tokenCache = new Map<string, string>();

export const cssToken = (name: string): string => {
  const cached = tokenCache.get(name);
  if (cached !== undefined) return cached;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  tokenCache.set(name, value);
  return value;
};

export const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
};
