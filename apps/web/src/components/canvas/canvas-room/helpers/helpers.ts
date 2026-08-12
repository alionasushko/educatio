import { LiveMap, LiveObject } from "@liveblocks/client";
import type { CanvasElement } from "@educatio/shared";
import type { LatestSnapshotResponse } from "@educatio/shared/api/snapshot";

type Snapshot = LatestSnapshotResponse["snapshot"];

const isCanvasElement = (value: unknown): value is CanvasElement => {
  if (typeof value !== "object" || value === null) return false;
  const element = value as Record<string, unknown>;
  return (
    typeof element.id === "string" &&
    typeof element.type === "string" &&
    typeof element.x === "number" &&
    typeof element.y === "number"
  );
};

const seedElements = (snapshot: Snapshot): [string, CanvasElement][] =>
  Object.entries(snapshot?.canvasState ?? {}).filter(
    (entry): entry is [string, CanvasElement] => isCanvasElement(entry[1]),
  );

export const buildInitialStorage = (snapshot: Snapshot) => {
  const elements = seedElements(snapshot);
  return {
    elements: new LiveMap(elements),
    metadata: new LiveObject({
      lastEditedAt: snapshot ? Date.parse(snapshot.snapshotAt) : 0,
      elementCount: elements.length,
    }),
  };
};
