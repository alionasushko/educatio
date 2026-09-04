"use server";

import { setPasswordSchema } from "@educatio/shared/api/auth";
import { setPassword } from "@/lib/api-auth";
import { actionError, validated, type ActionResult } from "@/lib/api-error";
import { ERROR_COPY } from "@/lib/error-messages";
import { issueSessionCookie } from "@/lib/issue-session";

export const setPasswordAction = async (
  password: string,
  currentPassword?: string,
): Promise<ActionResult> => {
  const parsed = validated(setPasswordSchema, {
    password,
    currentPassword: currentPassword || undefined,
  });
  if (!parsed.ok) return parsed;

  let sessionJwt: string;
  try {
    ({ sessionJwt } = await setPassword(parsed.data));
  } catch (err) {
    return actionError(err, {
      invalid_credentials: {
        message: "Your current password is incorrect.",
        field: "currentPassword",
      },
    });
  }

  const claims = await issueSessionCookie(sessionJwt, "tutor");
  if (!claims) return { ok: false, error: ERROR_COPY.internal_error };

  return { ok: true, data: undefined };
};
