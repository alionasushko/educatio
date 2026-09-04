import { z } from "zod";
import { lessonPath } from "./lessons";
import { MAX_ELEMENT_ID, canvasElementSchema } from "./canvas-element";

export const SNAPSHOT_SEGMENT = "snapshot";
export const lessonSnapshotPath = (lessonId: string) =>
  `${lessonPath(lessonId)}/${SNAPSHOT_SEGMENT}`;

export const MAX_SNAPSHOT_ELEMENTS = 2000;
export const MAX_SNAPSHOT_BYTES = 4 * 1024 * 1024;

const elementLimit = {
  check: (state: Record<string, unknown>) =>
    Object.keys(state).length <= MAX_SNAPSHOT_ELEMENTS,
  message: `A canvas can hold at most ${MAX_SNAPSHOT_ELEMENTS} elements.`,
};

const storedCanvasStateSchema = z
  .record(z.string(), z.unknown())
  .refine(elementLimit.check, { message: elementLimit.message });

const canvasStateSchema = z
  .record(z.string().min(1).max(MAX_ELEMENT_ID), canvasElementSchema)
  .refine(elementLimit.check, { message: elementLimit.message });

export const snapshotSchema = z.object({
  canvasState: canvasStateSchema,
});
export type SnapshotInput = z.infer<typeof snapshotSchema>;

export const latestSnapshotResponseSchema = z.object({
  snapshot: z
    .object({
      canvasState: storedCanvasStateSchema,
      snapshotAt: z.iso.datetime(),
    })
    .nullable(),
});
export type LatestSnapshotResponse = z.infer<
  typeof latestSnapshotResponseSchema
>;

export { okResponseSchema as snapshotResponseSchema } from "./common";
