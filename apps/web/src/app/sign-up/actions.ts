"use server";

import { redirect } from "next/navigation";
import { signupSchema, type SignupInput } from "@educatio/shared/api/auth";
import { signup } from "@/lib/api-auth";
import { actionError } from "@/lib/api-error";

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
    await signup(parsed.data);
  } catch (err) {
    return actionError(err);
  }

  redirect(`/verify?email=${encodeURIComponent(parsed.data.email)}`);
};
