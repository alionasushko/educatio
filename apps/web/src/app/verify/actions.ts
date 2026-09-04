"use server";

import { cookies } from "next/headers";

import { signinSchema } from "@educatio/shared/api/auth";
import { requestMagicLink } from "@/lib/api-auth";
import { bindMagicLink } from "@/lib/issue-session";
import { actionError, validated, type ActionResult } from "@/lib/api-error";
import { getCurrentSession } from "@/lib/session-server";
import { INVALID_EMAIL } from "@/lib/form-validation";

export const checkSessionAction = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return session?.kind === "tutor";
};

export const resendAction = async (email: string): Promise<ActionResult> => {
  const parsed = validated(signinSchema, { email });
  if (!parsed.ok) return { ...parsed, error: INVALID_EMAIL };

  try {
    const { binding } = await requestMagicLink(parsed.data);
    await bindMagicLink(binding);
  } catch (err) {
    // Previously `{ ok: false }` with no message, so a failure showed nothing.
    return actionError(err);
  }

  return { ok: true, data: undefined };
};
