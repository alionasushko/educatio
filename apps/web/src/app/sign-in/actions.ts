"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signinSchema } from "@educatio/shared/api/auth";
import { api } from "@/lib/api-client";
import { POST_LOGIN_COOKIE, postLoginCookieOptions } from "@/lib/session";
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
    await api.post("/auth/signin", parsed.data);
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
