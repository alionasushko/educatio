import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  POST_LOGIN_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";
import { exchangeMagicLink } from "@/lib/api-auth";
import { query } from "@/lib/api-error";
import { ownSessionJwt } from "@/lib/session-server";
import { safeInternalPath } from "@/lib/request";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const signIn = new URL("/sign-in", req.nextUrl.origin);

  if (!token) {
    signIn.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(signIn);
  }

  const exchanged = await query(() => exchangeMagicLink(token));
  const sessionJwt =
    exchanged.data && (await ownSessionJwt(exchanged.data.sessionJwt));

  if (!sessionJwt) {
    signIn.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(signIn);
  }

  const dest =
    safeInternalPath(req.cookies.get(POST_LOGIN_COOKIE)?.value) ??
    "/set-password";

  const response = NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  response.cookies.set(SESSION_COOKIE, sessionJwt, sessionCookieOptions);
  response.cookies.delete(POST_LOGIN_COOKIE);
  return response;
}
