import { NextResponse, type NextRequest } from "next/server";
import {
  LINK_BINDING_COOKIE,
  POST_LOGIN_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptionsFor,
} from "@/lib/session";
import { exchangeMagicLink } from "@/lib/api-auth";
import { query } from "@/lib/api-error";
import { ownSession } from "@/lib/session-server";
import { safeInternalPath } from "@/lib/request";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const binding = req.cookies.get(LINK_BINDING_COOKIE)?.value;
  const signIn = new URL("/sign-in", req.nextUrl.origin);

  if (!token || !binding) {
    signIn.searchParams.set("error", token ? "wrong-device" : "invalid-token");
    return NextResponse.redirect(signIn);
  }

  const exchanged = await query(() => exchangeMagicLink({ token, binding }));
  const claims = exchanged.data
    ? await ownSession(exchanged.data.sessionJwt)
    : null;

  if (!exchanged.data || !claims) {
    signIn.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(signIn);
  }

  const dest =
    safeInternalPath(req.cookies.get(POST_LOGIN_COOKIE)?.value) ??
    "/set-password";

  const response = NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  response.cookies.set(
    SESSION_COOKIE,
    exchanged.data.sessionJwt,
    sessionCookieOptionsFor(claims.exp),
  );
  response.cookies.delete(POST_LOGIN_COOKIE);
  response.cookies.delete(LINK_BINDING_COOKIE);
  return response;
}
