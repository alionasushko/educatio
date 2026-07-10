"use server";

import { redirect } from "next/navigation";
import { signupSchema, type SignupInput } from "@educatio/shared/api/auth";
import { api } from "@/lib/api-client";
import { forwardedIpHeaders } from "@/lib/client-ip";

export interface SignupActionResult {
  error: string;
}

export const signupAction = async (
  input: SignupInput,
): Promise<SignupActionResult | void> => {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  try {
    await api.post("/auth/signup", parsed.data, await forwardedIpHeaders());
  } catch (err) {
    console.error("signup action failed", err);
    return {
      error: "We couldn't create your account just now. Please try again.",
    };
  }

  redirect(`/verify?email=${encodeURIComponent(parsed.data.email)}`);
};
