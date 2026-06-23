import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  verifySessionToken,
} from "@/lib/session";
import { requireApiUrl } from "@/lib/api-base";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const signIn = new URL("/sign-in", req.nextUrl.origin);

  if (!token) {
    signIn.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(signIn);
  }

  const apiUrl = requireApiUrl();

  let sessionJwt: string;
  try {
    const res = await fetch(`${apiUrl}/auth/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) throw new Error("callback rejected");
    const data = (await res.json()) as { sessionJwt?: unknown };
    if (typeof data.sessionJwt !== "string" || !data.sessionJwt) {
      throw new Error("malformed callback response");
    }
    if (!(await verifySessionToken(data.sessionJwt))) {
      throw new Error("unverifiable session token");
    }
    sessionJwt = data.sessionJwt;
  } catch {
    signIn.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(signIn);
  }

  const response = NextResponse.redirect(
    new URL("/dashboard", req.nextUrl.origin),
  );
  response.cookies.set(SESSION_COOKIE, sessionJwt, sessionCookieOptions);
  return response;
}
