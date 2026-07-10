"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  signinSchema,
  passwordSigninSchema,
  type SessionResponse,
} from "@educatio/shared/api/auth";
import { api, ApiClientError } from "@/lib/api-client";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  POST_LOGIN_COOKIE,
  postLoginCookieOptions,
  verifySessionToken,
} from "@/lib/session";
import { safeInternalPath } from "@/lib/request";
import { forwardedIpHeaders } from "@/lib/client-ip";

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
    await api.post("/auth/signin", parsed.data, await forwardedIpHeaders());
  } catch (err) {
    console.error("signin action failed", err);
    return {
      error: "We couldn't send your magic link just now. Please try again.",
    };
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
    session = await api.post<SessionResponse>(
      "/auth/signin/password",
      parsed.data,
      await forwardedIpHeaders(),
    );
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      return { error: "Invalid email or password." };
    }
    console.error("password signin action failed", err);
    return { error: "We couldn't sign you in just now. Please try again." };
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
