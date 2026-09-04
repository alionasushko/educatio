import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES } from "@educatio/shared/api/upload";
import {
  MAX_SNAPSHOT_BYTES,
  lessonSnapshotPath,
} from "@educatio/shared/api/snapshot";
import { MULTIPART_LIMITS, raiseSnapshotBodyLimit } from "../src/config/server";

describe("what the api will accept in a request body", () => {
  it("bounds every multipart dimension, not only the file bytes", () => {
    expect(MULTIPART_LIMITS).toEqual({
      fileSize: MAX_UPLOAD_BYTES,
      files: 1,
      fields: 0,
      fieldSize: 0,
      parts: 1,
      headerPairs: 20,
    });
  });

  it("raises the body limit for the snapshot route only", () => {
    const snapshot = { url: lessonSnapshotPath(":lessonId"), bodyLimit: 0 };
    raiseSnapshotBodyLimit(snapshot);
    expect(snapshot.bodyLimit).toBe(MAX_SNAPSHOT_BYTES);
  });

  it("leaves every other route on the framework default", () => {
    for (const url of [
      "/auth/signin",
      "/auth/signup",
      "/lessons",
      "/lessons/:lessonId",
      "/lessons/:lessonId/summary",
      "/upload",
      "/sessions/student",
    ]) {
      const route: { url: string; bodyLimit?: number } = { url };
      raiseSnapshotBodyLimit(route);
      expect(route.bodyLimit, url).toBeUndefined();
    }
  });
});
