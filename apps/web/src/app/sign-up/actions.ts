"use server";

import { redirect } from "next/navigation";
import { signupSchema, type SignupInput } from "@educatio/shared/api/auth";
import { signup } from "@/lib/api-auth";
import { actionError, validated, type ActionResult } from "@/lib/api-error";

export const signupAction = async (
  input: SignupInput,
): Promise<ActionResult> => {
  const parsed = validated(signupSchema, input);
  if (!parsed.ok) return parsed;

  try {
    await signup(parsed.data);
  } catch (err) {
    return actionError(err);
  }

  redirect(`/verify?email=${encodeURIComponent(parsed.data.email)}`);
};
