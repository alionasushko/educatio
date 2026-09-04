import { NextResponse, type NextRequest } from "next/server";
import { LINK_BINDING_COOKIE, POST_LOGIN_COOKIE } from "@/lib/session";
import { exchangeMagicLink } from "@/lib/api-auth";
import { query } from "@/lib/api-error";
import { attachSessionCookie } from "@/lib/issue-session";
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
  const dest =
    safeInternalPath(req.cookies.get(POST_LOGIN_COOKIE)?.value) ??
    "/set-password";
  const response = NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  const claims = exchanged.data
    ? await attachSessionCookie(response, exchanged.data.sessionJwt, "tutor")
    : null;

  if (!claims) {
    signIn.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(signIn);
  }

  response.cookies.delete(POST_LOGIN_COOKIE);
  response.cookies.delete(LINK_BINDING_COOKIE);
  return response;
}
