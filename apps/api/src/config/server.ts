import { MAX_UPLOAD_BYTES } from "@educatio/shared/api/upload";
import {
  MAX_SNAPSHOT_BYTES,
  SNAPSHOT_SEGMENT,
} from "@educatio/shared/api/snapshot";

export const MULTIPART_LIMITS = {
  fileSize: MAX_UPLOAD_BYTES,
  files: 1,
  fields: 0,
  fieldSize: 0,
  parts: 1,
  headerPairs: 20,
} as const;

interface RouteBodyLimit {
  url: string;
  bodyLimit?: number;
}

export const raiseSnapshotBodyLimit = (route: RouteBodyLimit): void => {
  if (route.url.endsWith(`/${SNAPSHOT_SEGMENT}`)) {
    route.bodyLimit = MAX_SNAPSHOT_BYTES;
  }
};

interface BodyLimitHost {
  addHook: (name: "onRoute", handler: (route: RouteBodyLimit) => void) => void;
}

export const applyRouteBodyLimits = (instance: BodyLimitHost): void => {
  instance.addHook("onRoute", raiseSnapshotBodyLimit);
};
