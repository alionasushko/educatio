"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { updateProfileSchema } from "@educatio/shared/api/auth";
import { deleteAccount, updateProfile } from "@/lib/api-auth";
import { actionError, validated, type ActionResult } from "@/lib/api-error";
import { SESSION_COOKIE } from "@/lib/session";

export const updateNameAction = async (name: string): Promise<ActionResult> => {
  const parsed = validated(updateProfileSchema, { name });
  if (!parsed.ok) return parsed;

  try {
    await updateProfile(parsed.data);
  } catch (err) {
    return actionError(err, {
      demo_readonly: "The demo account can't be renamed.",
    });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
};

export const deleteAccountAction = async (): Promise<ActionResult> => {
  try {
    await deleteAccount();
  } catch (err) {
    return actionError(err, {
      demo_readonly: "The demo account can't be deleted.",
    });
  }

  (await cookies()).delete(SESSION_COOKIE);
  return { ok: true, data: undefined };
};
