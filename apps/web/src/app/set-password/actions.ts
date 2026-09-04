"use server";

import { cookies } from "next/headers";
import { setPasswordSchema } from "@educatio/shared/api/auth";
import { setPassword } from "@/lib/api-auth";
import { actionError, validated, type ActionResult } from "@/lib/api-error";
import { SESSION_COOKIE, sessionCookieOptionsFor } from "@/lib/session";
import { ownSession } from "@/lib/session-server";

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

  const claims = await ownSession(sessionJwt);
  if (claims) {
    (await cookies()).set(
      SESSION_COOKIE,
      sessionJwt,
      sessionCookieOptionsFor(claims.exp),
    );
  }

  return { ok: true, data: undefined };
};
