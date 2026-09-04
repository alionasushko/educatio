"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  signinSchema,
  passwordSigninSchema,
  type SessionResponse,
} from "@educatio/shared/api/auth";
import { requestMagicLink, signinWithPassword } from "@/lib/api-auth";
import { actionError, validated, type ActionResult } from "@/lib/api-error";
import { ERROR_COPY } from "@/lib/error-messages";
import { POST_LOGIN_COOKIE, postLoginCookieOptions } from "@/lib/session";
import { bindMagicLink, issueSessionCookie } from "@/lib/issue-session";
import { safeInternalPath } from "@/lib/request";

export const signinAction = async (
  email: string,
  callbackUrl?: string,
): Promise<ActionResult> => {
  const parsed = validated(signinSchema, { email });
  if (!parsed.ok) return { ...parsed, error: "Enter a valid email address." };

  try {
    const { binding } = await requestMagicLink(parsed.data);
    await bindMagicLink(binding);
  } catch (err) {
    return actionError(err);
  }

  const dest = safeInternalPath(callbackUrl);
  const store = await cookies();
  if (dest) store.set(POST_LOGIN_COOKIE, dest, postLoginCookieOptions);
  else store.delete(POST_LOGIN_COOKIE);

  redirect(`/verify?email=${encodeURIComponent(parsed.data.email)}`);
};

export const signinPasswordAction = async (
  email: string,
  password: string,
  callbackUrl?: string,
): Promise<ActionResult> => {
  const parsed = validated(passwordSigninSchema, { email, password });
  if (!parsed.ok) return { ...parsed, error: "Enter your email and password." };

  let session: SessionResponse;
  try {
    session = await signinWithPassword(parsed.data);
  } catch (err) {
    // A bare 401 here is a proxy answering, not the api — it names
    // invalid_credentials for every failure on this route.
    return actionError(err, { unauthorized: ERROR_COPY.invalid_credentials });
  }

  const claims = await issueSessionCookie(session.sessionJwt, "tutor");
  if (!claims) return { ok: false, error: ERROR_COPY.internal_error };

  redirect(safeInternalPath(callbackUrl) ?? "/dashboard");
};
