"use server";

import { setPasswordSchema } from "@educatio/shared/api/auth";
import { setPassword } from "@/lib/api-auth";
import { actionError } from "@/lib/api-error";

export interface SetPasswordResult {
  ok?: true;
  error?: string;
}

export const setPasswordAction = async (
  password: string,
): Promise<SetPasswordResult> => {
  const parsed = setPasswordSchema.safeParse({ password });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Choose a valid password.",
    };
  }

  try {
    await setPassword(parsed.data);
    return { ok: true };
  } catch (err) {
    return actionError(err);
  }
};
