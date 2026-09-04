import "server-only";
import { cookies } from "next/headers";
import { TIMEZONE_COOKIE, safeTimeZone } from "./timezone";

export interface ReadTimeZone {
  raw?: string;
  timeZone?: string;
}

export const readTimeZone = async (): Promise<ReadTimeZone> => {
  const raw = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  return { raw, timeZone: safeTimeZone(raw) };
};
