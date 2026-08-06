"use server";

import { signinSchema } from "@educatio/shared/api/auth";
import { requestMagicLink } from "@/lib/api-auth";
import { query } from "@/lib/api-error";
import { getCurrentSession } from "@/lib/session-server";

export interface ResendResult {
  ok: boolean;
}

export const checkSessionAction = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return session?.kind === "tutor";
};

export const resendAction = async (email: string): Promise<ResendResult> => {
  const parsed = signinSchema.safeParse({ email });
  if (!parsed.success) return { ok: false };

  const sent = await query(async () => {
    await requestMagicLink(parsed.data);
    return true as const;
  });

  return { ok: sent === true };
};
