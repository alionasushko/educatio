import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { fetchVerifiedSessionJwt } from "@/lib/session-server";
import { clientIpHeaders, isCrossSiteRequest } from "@/lib/request";

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const sessionJwt = await fetchVerifiedSessionJwt("/auth/demo", {
    method: "POST",
    headers: clientIpHeaders(req),
  });

  if (!sessionJwt) {
    return NextResponse.redirect(
      new URL("/sign-up?error=demo-unavailable", req.nextUrl.origin),
      { status: 303 },
    );
  }

  const response = NextResponse.redirect(
    new URL("/dashboard", req.nextUrl.origin),
    { status: 303 },
  );
  response.cookies.set(SESSION_COOKIE, sessionJwt, sessionCookieOptions);
  return response;
}
