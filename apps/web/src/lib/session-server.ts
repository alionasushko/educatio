import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import { signInRoute } from "./routes";
import type { SessionClaims, TutorSessionClaims } from "@educatio/shared";

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
  if (!tutor) redirect(signInRoute(callbackUrl));
  return tutor;
};

export const ownSession = async (
  sessionJwt: string,
): Promise<SessionClaims | null> => {
  const claims = await verifySessionToken(sessionJwt);
  if (!claims) {
    console.error(
      "session token failed verification — does web AUTH_JWT_SECRET match the api?",
    );
  }
  return claims;
};
