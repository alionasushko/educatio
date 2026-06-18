import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

const API_URL = process.env.EDUCATIO_API_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      await fetch(`${API_URL}/auth/signout`, {
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
