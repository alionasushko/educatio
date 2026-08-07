"use server";

import { deleteLesson } from "@/lib/api-lessons";
import { actionError, type ActionResult } from "@/lib/api-error";
import { revalidateLessons } from "@/lib/revalidate";

export const deleteLessonAction = async (
  lessonId: string,
): Promise<ActionResult> => {
  try {
    await deleteLesson(lessonId);
  } catch (err) {
    return actionError(err, {
      forbidden: "This lesson no longer exists.",
      not_found: "This lesson no longer exists.",
    });
  }

  revalidateLessons();
  return { ok: true, data: undefined };
};
