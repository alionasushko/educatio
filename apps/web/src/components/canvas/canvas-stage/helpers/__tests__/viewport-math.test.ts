import { describe, expect, it } from "vitest";
import { MAX_SCALE, MIN_SCALE } from "../constants";
import { clampScale, panBy, zoomAt } from "../helpers";
import { localBounds } from "../bounds";
import type { CanvasElement } from "@educatio/shared";

const viewport = { x: 0, y: 0, scale: 1 };

describe("clampScale", () => {
  it("holds the zoom inside its limits", () => {
    expect(clampScale(0.0001)).toBe(MIN_SCALE);
    expect(clampScale(1000)).toBe(MAX_SCALE);
    expect(clampScale(1.5)).toBe(1.5);
  });
});

describe("zoomAt", () => {
  it("keeps the point under the cursor fixed while zooming", () => {
    const pointer = { x: 300, y: 200 };
    const before = {
      x: (pointer.x - viewport.x) / viewport.scale,
      y: (pointer.y - viewport.y) / viewport.scale,
    };

    const next = zoomAt(viewport, pointer.x, pointer.y, 2);
    const after = {
      x: (pointer.x - next.x) / next.scale,
      y: (pointer.y - next.y) / next.scale,
    };

    expect(after.x).toBeCloseTo(before.x, 6);
    expect(after.y).toBeCloseTo(before.y, 6);
  });

  it("does not drift the origin when the zoom is already clamped", () => {
    const maxed = { x: 10, y: 20, scale: MAX_SCALE };
    expect(zoomAt(maxed, 100, 100, 4)).toEqual(maxed);
  });
});

describe("panBy", () => {
  it("moves the origin and leaves the zoom alone", () => {
    expect(panBy({ x: 5, y: 5, scale: 2 }, 10, -3)).toEqual({
      x: 15,
      y: 2,
      scale: 2,
    });
  });
});

describe("localBounds", () => {
  const base = {
    id: "e1",
    x: 100,
    y: 50,
    rotation: 0,
    zIndex: 1,
    createdBy: "u1",
    createdAt: 0,
  };

  it("uses the declared box for sized elements", () => {
    const sticky: CanvasElement = {
      ...base,
      type: "sticky",
      width: 190,
      height: 190,
      content: "",
      color: "yellow",
    };
    expect(localBounds(sticky)).toEqual({
      x: 0,
      y: 0,
      width: 190,
      height: 190,
    });
  });

  it("derives a box from a path's points, padded by its stroke", () => {
    const path: CanvasElement = {
      ...base,
      type: "path",
      points: [0, 0, 40, 10, 20, 60],
      stroke: "#000",
      strokeWidth: 4,
    };
    expect(localBounds(path)).toEqual({
      x: -2,
      y: -2,
      width: 44,
      height: 64,
    });
  });

  it("survives a path with no points rather than returning NaN", () => {
    const empty: CanvasElement = {
      ...base,
      type: "path",
      points: [],
      stroke: "#000",
      strokeWidth: 2,
    };
    expect(localBounds(empty)).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});
