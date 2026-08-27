"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  studentSessionSchema,
  type StudentSessionInput,
} from "@educatio/shared/api/sessions";
import { createStudentSession } from "@/lib/api-sessions";
import { actionError, validated, type ActionResult } from "@/lib/api-error";
import { ERROR_COPY } from "@/lib/error-messages";
import { SESSION_COOKIE, sessionCookieOptionsFor } from "@/lib/session";
import { ownSession } from "@/lib/session-server";

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

  const claims = await ownSession(sessionJwt);
  if (claims?.kind !== "student") {
    return { ok: false, error: ERROR_COPY.malformed_response };
  }

  (await cookies()).set(
    SESSION_COOKIE,
    sessionJwt,
    sessionCookieOptionsFor(claims.exp),
  );
  redirect(`/lesson/${encodeURIComponent(claims.lessonId)}?role=student`);
};
