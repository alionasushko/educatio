import { describe, expect, it } from "vitest";
import type { CanvasElement } from "@educatio/shared";
import {
  arrowHead,
  boundsOf,
  clampLines,
  extentOf,
  fitLines,
  pathPoints,
  safeImageSrc,
  wrapLines,
} from "../helpers/helpers";

const base = {
  id: "a",
  rotation: 0,
  zIndex: 0,
  createdBy: "t",
  createdAt: 0,
};

const sticky = (x: number, y: number): CanvasElement => ({
  ...base,
  type: "sticky",
  x,
  y,
  width: 100,
  height: 80,
  content: "hi",
  color: "yellow",
});

const stroke = (): CanvasElement => ({
  ...base,
  type: "path",
  x: 50,
  y: 60,
  points: [0, 0, 30, -10, 60, 40],
  stroke: "--text-primary",
  strokeWidth: 3,
});

describe("extentOf", () => {
  it("uses the element's own box when it has one", () => {
    expect(extentOf(sticky(10, 20))).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 80,
    });
  });

  it("derives a stroke's box from its points, which are relative", () => {
    expect(extentOf(stroke())).toEqual({ x: 50, y: 50, width: 60, height: 50 });
  });
});

describe("boundsOf", () => {
  it("covers every element and adds the padding", () => {
    const view = boundsOf([sticky(0, 0), sticky(200, 100)], 10);
    expect(view).toEqual({ x: -10, y: -10, width: 320, height: 200 });
  });

  it("never collapses to a zero-sized viewBox", () => {
    const dot: CanvasElement = {
      ...base,
      type: "path",
      x: 5,
      y: 5,
      points: [],
      stroke: "--x",
      strokeWidth: 1,
    };
    const view = boundsOf([dot], 0);
    expect(view.width).toBeGreaterThan(0);
    expect(view.height).toBeGreaterThan(0);
  });
});

describe("pathPoints", () => {
  it("offsets each pair by the element's origin", () => {
    expect(pathPoints({ x: 10, y: 20, points: [0, 0, 5, 5] })).toBe(
      "10,20 15,25",
    );
  });
});

describe("safeImageSrc", () => {
  it("passes ordinary web images", () => {
    expect(safeImageSrc("https://blob.example/x.png")).toBe(
      "https://blob.example/x.png",
    );
  });

  it("refuses anything else — canvas content is untrusted", () => {
    expect(safeImageSrc("javascript:alert(1)")).toBeNull();
    expect(safeImageSrc("data:image/svg+xml,<svg onload=alert(1)>")).toBeNull();
    expect(safeImageSrc("not a url")).toBeNull();
  });
});

describe("wrapLines", () => {
  it("breaks a long sentence to the element's width", () => {
    // The sticky in the report: one line that ran far past its own box.
    const lines = wrapLines("hello, this is the first lesson", 140, 15);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe("hello, this is the first lesson");
  });

  it("keeps short text on one line", () => {
    expect(wrapLines("world", 300, 16)).toEqual(["world"]);
  });

  it("hard-splits a word with no spaces to break on", () => {
    const lines = wrapLines("A".repeat(80), 100, 16);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join("")).toBe("A".repeat(80));
  });

  it("keeps the author's own line breaks", () => {
    expect(wrapLines("one\ntwo", 400, 14)).toEqual(["one", "two"]);
  });
});

describe("clampLines", () => {
  it("marks the cut with an ellipsis", () => {
    expect(clampLines(["a", "b", "c"], 2)).toEqual(["a", "b…"]);
  });

  it("leaves text that already fits alone", () => {
    expect(clampLines(["a", "b"], 5)).toEqual(["a", "b"]);
  });
});

describe("fitLines", () => {
  it("never returns more lines than the element is tall", () => {
    const long = "word ".repeat(200);
    const lines = fitLines(long, 200, 80, 15);
    expect(lines.length).toBeLessThanOrEqual(Math.floor(80 / (15 * 1.32)));
    expect(lines[lines.length - 1]).toMatch(/…$/);
  });
});

describe("arrowHead", () => {
  it("puts the point at the line's end", () => {
    const points = arrowHead(0, 0, 100, 0, 10).split(" ");
    expect(points[1]).toBe("100,0");
  });

  it("turns with the line", () => {
    const right = arrowHead(0, 0, 100, 0, 10).split(" ");
    const down = arrowHead(0, 0, 0, 100, 10).split(" ");
    expect(right[0]).not.toBe(down[0]);
  });

  it("keeps the barbs behind the point, not past it", () => {
    const [left, tip] = arrowHead(0, 0, 100, 0, 12).split(" ");
    expect(Number(left!.split(",")[0])).toBeLessThan(
      Number(tip!.split(",")[0]),
    );
  });
});
