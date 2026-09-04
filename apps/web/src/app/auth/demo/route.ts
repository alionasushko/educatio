import { NextResponse, type NextRequest } from "next/server";
import { demoLogin } from "@/lib/api-auth";
import { query } from "@/lib/api-error";
import { attachSessionCookie } from "@/lib/issue-session";
import { isCrossSiteRequest } from "@/lib/request";

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const issued = await query(demoLogin);
  const response = NextResponse.redirect(
    new URL("/dashboard", req.nextUrl.origin),
    { status: 303 },
  );
  const claims = issued.data
    ? await attachSessionCookie(response, issued.data.sessionJwt, "tutor")
    : null;

  if (!claims) {
    return NextResponse.redirect(
      new URL("/sign-up?error=demo-unavailable", req.nextUrl.origin),
      { status: 303 },
    );
  }

  return response;
}
