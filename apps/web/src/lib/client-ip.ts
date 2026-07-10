import "server-only";
import { headers } from "next/headers";

export const forwardedIpHeaders = async (): Promise<Record<string, string>> => {
  const store = await headers();
  const forwardedFor = store.get("x-forwarded-for") ?? store.get("x-real-ip");
  return forwardedFor ? { "x-forwarded-for": forwardedFor } : {};
};
