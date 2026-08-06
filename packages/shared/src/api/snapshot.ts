import { z } from "zod";
import { lessonPath } from "./lessons";

export const SNAPSHOT_SEGMENT = "snapshot";
export const lessonSnapshotPath = (lessonId: string) =>
  `${lessonPath(lessonId)}/${SNAPSHOT_SEGMENT}`;

export const snapshotSchema = z.object({
  canvasState: z.record(z.string(), z.unknown()),
});
export type SnapshotInput = z.infer<typeof snapshotSchema>;

export { okResponseSchema as snapshotResponseSchema } from "./common";
