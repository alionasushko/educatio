import type { CanvasElement } from "@educatio/shared";
import type { StageSize } from "./types";

export const localBounds = (
  element: CanvasElement,
): StageSize & { x: number; y: number } => {
  if (element.type !== "path") {
    return { x: 0, y: 0, width: element.width, height: element.height };
  }

  const xs = element.points.filter((_, index) => index % 2 === 0);
  const ys = element.points.filter((_, index) => index % 2 === 1);
  if (xs.length === 0 || ys.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const pad = element.strokeWidth / 2;
  return {
    x: minX - pad,
    y: minY - pad,
    width: Math.max(...xs) - minX + element.strokeWidth,
    height: Math.max(...ys) - minY + element.strokeWidth,
  };
};
