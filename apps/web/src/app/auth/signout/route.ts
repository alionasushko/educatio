import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { signout } from "@/lib/api-auth";
import { query } from "@/lib/api-error";
import { isCrossSiteRequest } from "@/lib/request";

export async function POST(req: NextRequest) {
  if (isCrossSiteRequest(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (req.cookies.get(SESSION_COOKIE)?.value) await query(signout);

  const response = NextResponse.redirect(new URL("/", req.nextUrl.origin));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
