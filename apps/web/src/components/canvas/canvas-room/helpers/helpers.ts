import { LiveMap, LiveObject } from "@liveblocks/client";
import type { LatestSnapshotResponse } from "@educatio/shared/api/snapshot";
import { snapshotEntries } from "@/lib/canvas-elements";

type Snapshot = LatestSnapshotResponse["snapshot"];

export const buildInitialStorage = (snapshot: Snapshot) => {
  const elements = snapshotEntries(snapshot);
  return {
    elements: new LiveMap(elements),
    metadata: new LiveObject({
      lastEditedAt: snapshot ? Date.parse(snapshot.snapshotAt) : 0,
    }),
  };
};
