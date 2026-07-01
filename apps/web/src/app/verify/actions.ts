"use server";

import { signinSchema } from "@educatio/shared/api/auth";
import { api } from "@/lib/api-client";

export interface ResendResult {
  ok: boolean;
}

export const resendAction = async (email: string): Promise<ResendResult> => {
  const parsed = signinSchema.safeParse({ email });
  if (!parsed.success) return { ok: false };

  try {
    await api.post("/auth/signin", parsed.data);
    return { ok: true };
  } catch (err) {
    console.error("resend action failed", err);
    return { ok: false };
  }
};
