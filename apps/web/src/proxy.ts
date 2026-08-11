import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { signInRoute } from "@/lib/routes";

const STUDENT_LESSON_SUBPATHS = ["summary"];

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const studentReachableLessonId = (pathname: string): string | null => {
  const [first, id, ...rest] = pathname.split("/").filter(Boolean);
  if (first !== "lesson" || !id || id === "new") return null;
  if (rest.length === 0) return safeDecode(id);
  return rest.length === 1 && STUDENT_LESSON_SUBPATHS.includes(rest[0] ?? "")
    ? safeDecode(id)
    : null;
};

const toSignIn = (req: NextRequest): NextResponse => {
  const target = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  return NextResponse.redirect(
    new URL(signInRoute(target), req.nextUrl.origin),
  );
};

export default async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySessionToken(token) : null;

  if (!claims) return toSignIn(req);

  if (claims.kind === "student") {
    if (!claims.lessonId) return toSignIn(req);

    const ownRoom = `/lesson/${claims.lessonId}`;
    const reachable = studentReachableLessonId(req.nextUrl.pathname);
    if (reachable !== claims.lessonId && req.nextUrl.pathname !== ownRoom) {
      return NextResponse.redirect(new URL(ownRoom, req.nextUrl.origin));
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
