import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { fetchVerifiedSessionJwt } from "@/lib/session-server";
import { clientIpHeaders } from "@/lib/request";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const signIn = new URL("/sign-in", req.nextUrl.origin);

  if (!token) {
    signIn.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(signIn);
  }

  const sessionJwt = await fetchVerifiedSessionJwt("/auth/callback", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...clientIpHeaders(req) },
    body: JSON.stringify({ token }),
  });

  if (!sessionJwt) {
    signIn.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(signIn);
  }

  const response = NextResponse.redirect(
    new URL("/dashboard", req.nextUrl.origin),
  );
  response.cookies.set(SESSION_COOKIE, sessionJwt, sessionCookieOptions);
  return response;
}
