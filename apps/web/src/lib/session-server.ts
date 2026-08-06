import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import { requireApiUrl } from "./api-base";
import type { SessionClaims, TutorSessionClaims } from "@educatio/shared";

const SESSION_FETCH_TIMEOUT_MS = 30_000;

export const getCurrentSession = async (): Promise<SessionClaims | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
};

export const redirectSignedInTutor = async (
  to = "/dashboard",
): Promise<void> => {
  const session = await getCurrentSession();
  if (session?.kind === "tutor") redirect(to);
};

const currentTutor = async (): Promise<TutorSessionClaims | null> => {
  const session = await getCurrentSession();
  return session?.kind === "tutor" ? session : null;
};

export const requireTutor = async (
  callbackUrl: string,
): Promise<TutorSessionClaims> => {
  const tutor = await currentTutor();
  if (!tutor)
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return tutor;
};

export const fetchVerifiedSessionJwt = async (
  path: string,
  init?: RequestInit,
): Promise<string | null> => {
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
};
