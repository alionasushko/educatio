"use server";

import { setPasswordSchema } from "@educatio/shared/api/auth";
import { setPassword } from "@/lib/api-auth";
import { actionError, validated, type ActionResult } from "@/lib/api-error";

export const setPasswordAction = async (
  password: string,
): Promise<ActionResult> => {
  const parsed = validated(setPasswordSchema, { password });
  if (!parsed.ok) return parsed;

  try {
    await setPassword(parsed.data);
  } catch (err) {
    return actionError(err);
  }

  return { ok: true, data: undefined };
};
