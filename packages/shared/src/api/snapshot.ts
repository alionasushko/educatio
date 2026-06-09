import { z } from "zod";

export const snapshotSchema = z.object({
  canvasState: z.record(z.string(), z.unknown()),
});
export type SnapshotInput = z.infer<typeof snapshotSchema>;
