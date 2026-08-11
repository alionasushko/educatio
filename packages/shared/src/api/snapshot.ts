import { z } from "zod";
import { lessonPath } from "./lessons";

export const SNAPSHOT_SEGMENT = "snapshot";
export const lessonSnapshotPath = (lessonId: string) =>
  `${lessonPath(lessonId)}/${SNAPSHOT_SEGMENT}`;

const canvasStateSchema = z.record(z.string(), z.unknown());

export const snapshotSchema = z.object({
  canvasState: canvasStateSchema,
});
export type SnapshotInput = z.infer<typeof snapshotSchema>;

export const latestSnapshotResponseSchema = z.object({
  snapshot: z
    .object({
      canvasState: canvasStateSchema,
      snapshotAt: z.iso.datetime(),
    })
    .nullable(),
});
export type LatestSnapshotResponse = z.infer<
  typeof latestSnapshotResponseSchema
>;

export { okResponseSchema as snapshotResponseSchema } from "./common";
