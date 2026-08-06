"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  signinSchema,
  passwordSigninSchema,
  type SessionResponse,
} from "@educatio/shared/api/auth";
import { requestMagicLink, signinWithPassword } from "@/lib/api-auth";
import { actionError } from "@/lib/api-error";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  POST_LOGIN_COOKIE,
  postLoginCookieOptions,
  verifySessionToken,
} from "@/lib/session";
import { safeInternalPath } from "@/lib/request";

export interface SigninActionResult {
  error: string;
}

export const signinAction = async (
  email: string,
  callbackUrl?: string,
): Promise<SigninActionResult | void> => {
  const parsed = signinSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  try {
    await requestMagicLink(parsed.data);
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
): Promise<SigninActionResult | void> => {
  const parsed = passwordSigninSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: "Enter your email and password." };
  }

  let session: SessionResponse;
  try {
    session = await signinWithPassword(parsed.data);
  } catch (err) {
    return actionError(err, {
      unauthorized: "Invalid email or password.",
    });
  }

  if (!(await verifySessionToken(session.sessionJwt))) {
    console.error(
      "password signin: session token failed verification — does web AUTH_JWT_SECRET match the api?",
    );
    return { error: "We couldn't sign you in just now. Please try again." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, session.sessionJwt, sessionCookieOptions);

  redirect(safeInternalPath(callbackUrl) ?? "/dashboard");
};
