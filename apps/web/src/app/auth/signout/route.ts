import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const apiUrl = process.env.EDUCATIO_API_URL;

  if (token && apiUrl) {
    try {
      await fetch(`${apiUrl}/auth/signout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore — we still clear the cookie below
    }
  }

  const response = NextResponse.redirect(new URL("/", req.nextUrl.origin));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
