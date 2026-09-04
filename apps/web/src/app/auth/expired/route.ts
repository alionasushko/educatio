import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { isCrossSiteRequest } from "@/lib/request";
import { signInRoute } from "@/lib/routes";

export async function GET(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const signIn = new URL(signInRoute(), req.nextUrl.origin);
  signIn.searchParams.set("error", "session-expired");

  const response = NextResponse.redirect(signIn);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
