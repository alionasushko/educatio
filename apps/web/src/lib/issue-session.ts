import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { SessionClaims } from "@educatio/shared";
import {
  LINK_BINDING_COOKIE,
  SESSION_COOKIE,
  linkBindingCookieOptions,
  sessionCookieOptionsFor,
  verifySessionToken,
} from "./session";

type SessionKind = SessionClaims["kind"];

type ClaimsOf<K extends SessionKind> = Extract<SessionClaims, { kind: K }>;

const verifiedClaims = async <K extends SessionKind>(
  sessionJwt: string,
  kind: K,
): Promise<ClaimsOf<K> | null> => {
  const claims = await verifySessionToken(sessionJwt);
  if (!claims) {
    console.error(
      "session token failed verification — does web AUTH_JWT_SECRET match the api?",
    );
    return null;
  }
  if (claims.kind !== kind) {
    console.error(`session token is a ${claims.kind}, expected a ${kind}`);
    return null;
  }
  return claims as ClaimsOf<K>;
};

export const issueSessionCookie = async <K extends SessionKind>(
  sessionJwt: string,
  kind: K,
): Promise<ClaimsOf<K> | null> => {
  const claims = await verifiedClaims(sessionJwt, kind);
  if (!claims) return null;

  const store = await cookies();
  store.set(SESSION_COOKIE, sessionJwt, sessionCookieOptionsFor(claims.exp));
  return claims;
};

export const attachSessionCookie = async <K extends SessionKind>(
  response: NextResponse,
  sessionJwt: string,
  kind: K,
): Promise<ClaimsOf<K> | null> => {
  const claims = await verifiedClaims(sessionJwt, kind);
  if (!claims) return null;

  response.cookies.set(
    SESSION_COOKIE,
    sessionJwt,
    sessionCookieOptionsFor(claims.exp),
  );
  return claims;
};

export const bindMagicLink = async (binding: string): Promise<void> => {
  const store = await cookies();
  store.set(LINK_BINDING_COOKIE, binding, linkBindingCookieOptions);
};
