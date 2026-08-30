import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { safeInternalPath } from "@/lib/request";
import { signInRoute } from "@/lib/routes";

export async function GET(req: NextRequest) {
  const from = safeInternalPath(req.nextUrl.searchParams.get("from"));
  const signIn = new URL(signInRoute(from ?? undefined), req.nextUrl.origin);
  signIn.searchParams.set("error", "session-expired");

  const response = NextResponse.redirect(signIn);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
