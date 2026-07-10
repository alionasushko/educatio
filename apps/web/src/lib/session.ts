import { jwtVerify } from "jose";
import { sessionClaimsSchema, type SessionClaims } from "@educatio/shared";

export const SESSION_COOKIE = "educatio_session";

export const POST_LOGIN_COOKIE = "educatio_post_login";

export const verifySessionToken = async (
  token: string,
): Promise<SessionClaims | null> => {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] },
    );
    const parsed = sessionClaimsSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export const sessionCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export const postLoginCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: true,
  path: "/",
  maxAge: 60 * 10,
};
