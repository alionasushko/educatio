import "server-only";
import {
  lessonSnapshotPath,
  latestSnapshotResponseSchema,
  type LatestSnapshotResponse,
} from "@educatio/shared/api/snapshot";
import { api } from "./api-client";

export const getLatestSnapshot = (lessonId: string) =>
  api.get<LatestSnapshotResponse>(lessonSnapshotPath(lessonId), {
    schema: latestSnapshotResponseSchema,
  });
