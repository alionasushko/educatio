"use server";

import { setPasswordSchema } from "@educatio/shared/api/auth";
import { api, ApiClientError } from "@/lib/api-client";
import { forwardedIpHeaders } from "@/lib/client-ip";

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
    await api.post("/auth/password", parsed.data, await forwardedIpHeaders());
    return { ok: true };
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      return { error: "Your session has expired. Please sign in again." };
    }
    console.error("set password action failed", err);
    return {
      error: "We couldn't update your password just now. Please try again.",
    };
  }
};
