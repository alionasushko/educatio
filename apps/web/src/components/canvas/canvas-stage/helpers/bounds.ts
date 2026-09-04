import type { CanvasElement } from "@educatio/shared";
import { rangeOf } from "@/lib/range";
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

  const x = rangeOf(xs);
  const y = rangeOf(ys);
  const pad = element.strokeWidth / 2;
  return {
    x: x.min - pad,
    y: y.min - pad,
    width: x.max - x.min + element.strokeWidth,
    height: y.max - y.min + element.strokeWidth,
  };
};
