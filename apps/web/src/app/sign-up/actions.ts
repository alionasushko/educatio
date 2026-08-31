"use server";

import { cookies } from "next/headers";

import { redirect } from "next/navigation";
import { signupSchema, type SignupInput } from "@educatio/shared/api/auth";
import { signup } from "@/lib/api-auth";
import { LINK_BINDING_COOKIE, linkBindingCookieOptions } from "@/lib/session";
import { actionError, validated, type ActionResult } from "@/lib/api-error";

export const signupAction = async (
  input: SignupInput,
): Promise<ActionResult> => {
  const parsed = validated(signupSchema, input);
  if (!parsed.ok) return parsed;

  try {
    const { binding } = await signup(parsed.data);
    (await cookies()).set(
      LINK_BINDING_COOKIE,
      binding,
      linkBindingCookieOptions,
    );
  } catch (err) {
    return actionError(err, {
      service_unavailable:
        "New accounts aren\u2019t available here yet \u2014 use \u201cExplore the demo\u201d to look around.",
    });
  }

  redirect(`/verify?email=${encodeURIComponent(parsed.data.email)}`);
};
