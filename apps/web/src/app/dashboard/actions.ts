"use server";

import { deleteLesson } from "@/lib/api-lessons";
import { actionError } from "@/lib/api-error";

export interface DeleteLessonResult {
  error?: string;
}

export const deleteLessonAction = async (
  lessonId: string,
): Promise<DeleteLessonResult> => {
  try {
    await deleteLesson(lessonId);
    return {};
  } catch (err) {
    return actionError(err, {
      forbidden: "This lesson no longer exists.",
      not_found: "This lesson no longer exists.",
    });
  }
};
