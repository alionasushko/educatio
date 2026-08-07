"use server";

import { redirect } from "next/navigation";
import {
  createLessonSchema,
  type CreateLessonInput,
  type CreateLessonResponse,
} from "@educatio/shared/api/lessons";
import { createLesson } from "@/lib/api-lessons";
import { actionError, validated, type ActionResult } from "@/lib/api-error";
import { revalidateLessons } from "@/lib/revalidate";

export const createLessonAction = async (
  input: CreateLessonInput,
): Promise<ActionResult> => {
  const parsed = validated(createLessonSchema, input);
  if (!parsed.ok) return parsed;

  let created: CreateLessonResponse;
  try {
    created = await createLesson(parsed.data);
  } catch (err) {
    return actionError(err);
  }

  revalidateLessons();
  redirect(`/lesson/${created.id}`);
};
