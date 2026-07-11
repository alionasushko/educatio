"use server";

import { redirect } from "next/navigation";
import {
  createLessonSchema,
  type CreateLessonInput,
  type CreateLessonResponse,
} from "@educatio/shared/api/lessons";
import { api } from "@/lib/api-client";

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
    created = await api.post<CreateLessonResponse>("/lessons", parsed.data);
  } catch (err) {
    console.error("create lesson action failed", err);
    return {
      error: "We couldn't create your lesson just now. Please try again.",
    };
  }

  redirect(`/lesson/${created.id}`);
};
