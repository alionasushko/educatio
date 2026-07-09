"use server";

import { redirect } from "next/navigation";
import { signinSchema } from "@educatio/shared/api/auth";
import { api } from "@/lib/api-client";

export interface SigninActionResult {
  error: string;
}

export const signinAction = async (
  email: string,
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

  redirect(`/verify?email=${encodeURIComponent(parsed.data.email)}`);
};
