"use server";

import { redirect } from "next/navigation";
import {
  createLessonSchema,
  type CreateLessonInput,
  type CreateLessonResponse,
} from "@educatio/shared/api/lessons";
import { createLesson } from "@/lib/api-lessons";
import { actionError } from "@/lib/api-error";

export interface CreateLessonResult {
  error: string;
}

export const createLessonAction = async (
  input: CreateLessonInput,
): Promise<CreateLessonResult | void> => {
  const parsed = createLessonSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Please check the form and retry.",
    };
  }

  let created: CreateLessonResponse;
  try {
    created = await createLesson(parsed.data);
  } catch (err) {
    return actionError(err);
  }

  redirect(`/lesson/${created.id}`);
};
