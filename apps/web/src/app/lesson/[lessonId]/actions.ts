"use server";

import { revalidatePath } from "next/cache";
import { snapshotSchema } from "@educatio/shared/api/snapshot";
import { saveSnapshot } from "@/lib/api-snapshots";
import { updateLesson } from "@/lib/api-lessons";
import { generateSummary } from "@/lib/api-summary";
import { actionError, validated, type ActionResult } from "@/lib/api-error";
import { revalidateLessons } from "@/lib/revalidate";
import { lessonSummaryHref } from "@/lib/routes";

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

export const endLessonAction = async (
  lessonId: string,
): Promise<ActionResult> => {
  try {
    await updateLesson(lessonId, { status: "ended" });
  } catch (err) {
    return actionError(err);
  }

  revalidateLessons();
  revalidatePath(lessonSummaryHref(lessonId));
  return { ok: true, data: undefined };
};

export const generateSummaryAction = async (
  lessonId: string,
): Promise<ActionResult> => {
  try {
    await generateSummary(lessonId);
  } catch (err) {
    return actionError(err);
  }

  revalidatePath(lessonSummaryHref(lessonId));
  return { ok: true, data: undefined };
};
