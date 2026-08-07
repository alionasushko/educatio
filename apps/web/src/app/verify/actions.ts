"use server";

import { signinSchema } from "@educatio/shared/api/auth";
import { requestMagicLink } from "@/lib/api-auth";
import { actionError, validated, type ActionResult } from "@/lib/api-error";
import { getCurrentSession } from "@/lib/session-server";

export const checkSessionAction = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return session?.kind === "tutor";
};

export const resendAction = async (email: string): Promise<ActionResult> => {
  const parsed = validated(signinSchema, { email });
  if (!parsed.ok) return { ...parsed, error: "Enter a valid email address." };

  try {
    await requestMagicLink(parsed.data);
  } catch (err) {
    // Previously `{ ok: false }` with no message, so a failure showed nothing.
    return actionError(err);
  }

  return { ok: true, data: undefined };
};
