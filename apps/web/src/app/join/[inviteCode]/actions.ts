"use server";

import { redirect } from "next/navigation";
import {
  studentSessionSchema,
  type StudentSessionInput,
} from "@educatio/shared/api/sessions";
import { createStudentSession } from "@/lib/api-sessions";
import { actionError, validated, type ActionResult } from "@/lib/api-error";
import { ERROR_COPY } from "@/lib/error-messages";
import { issueSessionCookie } from "@/lib/issue-session";

export const joinLessonAction = async (
  input: StudentSessionInput,
): Promise<ActionResult> => {
  const parsed = validated(studentSessionSchema, input);
  if (!parsed.ok) return parsed;

  let sessionJwt: string;
  try {
    ({ sessionJwt } = await createStudentSession(parsed.data));
  } catch (err) {
    return actionError(err);
  }

  const claims = await issueSessionCookie(sessionJwt, "student");
  if (!claims) {
    return { ok: false, error: ERROR_COPY.malformed_response };
  }

  redirect(`/lesson/${encodeURIComponent(claims.lessonId)}`);
};
