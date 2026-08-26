"use server";

import { snapshotSchema } from "@educatio/shared/api/snapshot";
import { saveSnapshot } from "@/lib/api-snapshots";
import { actionError, validated, type ActionResult } from "@/lib/api-error";

export const persistCanvas = async (
  lessonId: string,
  canvasState: Record<string, unknown>,
): Promise<ActionResult> => {
  const parsed = validated(snapshotSchema, { canvasState });
  if (!parsed.ok) return parsed;

  try {
    await saveSnapshot(lessonId, parsed.data);
    return { ok: true, data: undefined };
  } catch (err) {
    return actionError(err);
  }
};
