import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import { requireApiUrl } from "./api-base";
import type { SessionClaims } from "@educatio/shared";

const SESSION_FETCH_TIMEOUT_MS = 30_000;

export async function getCurrentSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function redirectSignedInTutor(to = "/dashboard"): Promise<void> {
  const session = await getCurrentSession();
  if (session?.kind === "tutor") redirect(to);
}

export async function fetchVerifiedSessionJwt(
  path: string,
  init?: RequestInit,
): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(`${requireApiUrl()}${path}`, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(SESSION_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    console.error(`session fetch to ${path} failed`, error);
    return null;
  }

  if (!res.ok) return null;

  let data: { sessionJwt?: unknown };
  try {
    data = (await res.json()) as { sessionJwt?: unknown };
  } catch {
    console.error(`session response from ${path} was not JSON`);
    return null;
  }

  if (typeof data.sessionJwt !== "string" || !data.sessionJwt) {
    console.error(`session response from ${path} had no sessionJwt`);
    return null;
  }

  if (!(await verifySessionToken(data.sessionJwt))) {
    console.error(
      `session token from ${path} failed verification — does web AUTH_JWT_SECRET match the api?`,
    );
    return null;
  }

  return data.sessionJwt;
}
