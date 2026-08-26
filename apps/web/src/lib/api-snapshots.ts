import "server-only";
import { okResponseSchema, type OkResponse } from "@educatio/shared/api/common";
import {
  lessonSnapshotPath,
  latestSnapshotResponseSchema,
  type LatestSnapshotResponse,
  type SnapshotInput,
} from "@educatio/shared/api/snapshot";
import { api } from "./api-client";

export const getLatestSnapshot = (lessonId: string) =>
  api.get<LatestSnapshotResponse>(lessonSnapshotPath(lessonId), {
    schema: latestSnapshotResponseSchema,
  });

export const saveSnapshot = (lessonId: string, body: SnapshotInput) =>
  api.post<OkResponse>(lessonSnapshotPath(lessonId), {
    schema: okResponseSchema,
    body,
  });
