import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptionsFor } from "@/lib/session";
import { demoLogin } from "@/lib/api-auth";
import { query } from "@/lib/api-error";
import { ownSession } from "@/lib/session-server";
import { isCrossSiteRequest } from "@/lib/request";

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const issued = await query(demoLogin);
  const claims = issued.data ? await ownSession(issued.data.sessionJwt) : null;

  if (!issued.data || !claims) {
    return NextResponse.redirect(
      new URL("/sign-up?error=demo-unavailable", req.nextUrl.origin),
      { status: 303 },
    );
  }

  const response = NextResponse.redirect(
    new URL("/dashboard", req.nextUrl.origin),
    { status: 303 },
  );
  response.cookies.set(
    SESSION_COOKIE,
    issued.data.sessionJwt,
    sessionCookieOptionsFor(claims.exp),
  );
  return response;
}
