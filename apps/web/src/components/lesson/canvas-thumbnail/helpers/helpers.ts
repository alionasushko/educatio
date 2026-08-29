import type { CanvasElement } from "@educatio/shared";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const sized = (
  element: CanvasElement,
): { width: number; height: number } | null =>
  "width" in element && "height" in element
    ? { width: element.width, height: element.height }
    : null;

export const extentOf = (element: CanvasElement): Box => {
  const size = sized(element);
  if (size) {
    return { x: element.x, y: element.y, ...size };
  }

  if (element.type === "path" && element.points.length >= 2) {
    const xs = element.points.filter((_, index) => index % 2 === 0);
    const ys = element.points.filter((_, index) => index % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      x: element.x + minX,
      y: element.y + minY,
      width: Math.max(...xs) - minX,
      height: Math.max(...ys) - minY,
    };
  }

  return { x: element.x, y: element.y, width: 0, height: 0 };
};

export const boundsOf = (elements: CanvasElement[], padding: number): Box => {
  const extents = elements.map(extentOf);
  const minX = Math.min(...extents.map((box) => box.x));
  const minY = Math.min(...extents.map((box) => box.y));
  const maxX = Math.max(...extents.map((box) => box.x + box.width));
  const maxY = Math.max(...extents.map((box) => box.y + box.height));

  return {
    x: minX - padding,
    y: minY - padding,
    width: Math.max(maxX - minX + padding * 2, 1),
    height: Math.max(maxY - minY + padding * 2, 1),
  };
};

export const pathPoints = (element: {
  x: number;
  y: number;
  points: number[];
}): string => {
  const pairs: string[] = [];
  for (let index = 0; index + 1 < element.points.length; index += 2) {
    pairs.push(
      `${element.x + element.points[index]!},${element.y + element.points[index + 1]!}`,
    );
  }
  return pairs.join(" ");
};

export const SANS_RATIO = 0.52;
export const MONO_RATIO = 0.62;
export const LINE_HEIGHT = 1.32;

export const wrapLines = (
  content: string,
  maxWidth: number,
  fontSize: number,
  ratio = SANS_RATIO,
): string[] => {
  const perLine = Math.max(1, Math.floor(maxWidth / (fontSize * ratio)));
  const lines: string[] = [];

  for (const paragraph of content.split("\n")) {
    if (paragraph.trim().length === 0) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= perLine) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);

      let rest = word;
      while (rest.length > perLine) {
        lines.push(rest.slice(0, perLine));
        rest = rest.slice(perLine);
      }
      line = rest;
    }
    if (line) lines.push(line);
  }

  return lines;
};

export const clampLines = (lines: string[], maxLines: number): string[] => {
  if (maxLines < 1) return [];
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  const last = kept[maxLines - 1] ?? "";
  kept[maxLines - 1] = `${last.replace(/[\s.,;:]+$/, "")}…`;
  return kept;
};

export const fitLines = (
  content: string,
  width: number,
  height: number,
  fontSize: number,
  ratio = SANS_RATIO,
): string[] =>
  clampLines(
    wrapLines(content, width, fontSize, ratio),
    Math.floor(height / (fontSize * LINE_HEIGHT)),
  );

export const arrowHead = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size: number,
): string => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const spread = Math.PI / 7;
  const left = `${x2 - size * Math.cos(angle - spread)},${y2 - size * Math.sin(angle - spread)}`;
  const right = `${x2 - size * Math.cos(angle + spread)},${y2 - size * Math.sin(angle + spread)}`;
  return `${left} ${x2},${y2} ${right}`;
};

export const safeImageSrc = (src: string): string | null => {
  try {
    const url = new URL(src);
    return url.protocol === "https:" || url.protocol === "http:" ? src : null;
  } catch {
    return null;
  }
};

export const rotationOf = (
  element: CanvasElement,
  box: Box,
): string | undefined =>
  element.rotation
    ? `rotate(${element.rotation} ${box.x + box.width / 2} ${box.y + box.height / 2})`
    : undefined;
