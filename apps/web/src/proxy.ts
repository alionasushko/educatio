import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const STUDENT_LESSON_SUBPATHS = ["summary"];

const studentReachableLessonId = (pathname: string): string | null => {
  const [first, id, ...rest] = pathname.split("/").filter(Boolean);
  if (first !== "lesson" || !id || id === "new") return null;
  if (rest.length === 0) return id;
  return rest.length === 1 && STUDENT_LESSON_SUBPATHS.includes(rest[0] ?? "")
    ? id
    : null;
};

const toSignIn = (req: NextRequest): NextResponse => {
  const target = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = "";
  url.searchParams.set("callbackUrl", target);
  return NextResponse.redirect(url);
};

export default async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySessionToken(token) : null;

  if (!claims) return toSignIn(req);

  if (claims.kind === "student") {
    if (!claims.lessonId) return toSignIn(req);

    if (
      studentReachableLessonId(req.nextUrl.pathname) !==
      encodeURIComponent(claims.lessonId)
    ) {
      const url = req.nextUrl.clone();
      url.pathname = `/lesson/${claims.lessonId}`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/lesson/:path*",
    "/settings/:path*",
    "/set-password/:path*",
  ],
};
