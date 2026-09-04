import type { CanvasElement } from "@educatio/shared";
import { canvasElementSchema } from "@educatio/shared/api/canvas-element";
import type { LatestSnapshotResponse } from "@educatio/shared/api/snapshot";

type Snapshot = LatestSnapshotResponse["snapshot"];

export const snapshotEntries = (
  snapshot: Snapshot,
): [string, CanvasElement][] =>
  Object.entries(snapshot?.canvasState ?? {}).flatMap(
    ([id, value]): [string, CanvasElement][] => {
      const parsed = canvasElementSchema.safeParse(value);
      return parsed.success ? [[id, parsed.data]] : [];
    },
  );

export const snapshotElements = (snapshot: Snapshot): CanvasElement[] =>
  snapshotEntries(snapshot)
    .map(([, element]) => element)
    .sort((a, b) => a.zIndex - b.zIndex);
