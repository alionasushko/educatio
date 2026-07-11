"use server";

import { api, ApiClientError } from "@/lib/api-client";

export interface DeleteLessonResult {
  error?: string;
}

export const deleteLessonAction = async (
  lessonId: string,
): Promise<DeleteLessonResult> => {
  try {
    await api.del(`/lessons/${encodeURIComponent(lessonId)}`);
    return {};
  } catch (err) {
    if (
      err instanceof ApiClientError &&
      (err.status === 403 || err.status === 404)
    ) {
      return { error: "This lesson no longer exists." };
    }
    console.error("delete lesson action failed", err);
    return {
      error: "We couldn't delete this lesson just now. Please try again.",
    };
  }
};
