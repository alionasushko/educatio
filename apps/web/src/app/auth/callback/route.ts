import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

const API_URL = process.env.EDUCATIO_API_URL ?? "http://localhost:3001";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const signIn = new URL("/sign-in", req.nextUrl.origin);

  if (!token) {
    signIn.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(signIn);
  }

  let sessionJwt: string;
  try {
    const res = await fetch(`${API_URL}/auth/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) throw new Error("callback rejected");
    ({ sessionJwt } = (await res.json()) as { sessionJwt: string });
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
