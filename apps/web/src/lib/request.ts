import type { NextRequest } from "next/server";

export function isCrossSiteRequest(req: NextRequest): boolean {
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite) {
    return secFetchSite === "cross-site" || secFetchSite === "cross-origin";
  }
  const origin = req.headers.get("origin");
  return origin !== null && origin !== req.nextUrl.origin;
}

export function clientIpHeaders(req: NextRequest): Record<string, string> {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor ? { "x-forwarded-for": forwardedFor } : {};
}

const POST_LOGIN_PREFIXES = ["/dashboard", "/lesson", "/settings"];

const VALIDATION_BASE = "https://internal.invalid";

export const safeInternalPath = (
  raw: string | null | undefined,
): string | null => {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//"))
    return null;
  try {
    const url = new URL(raw, VALIDATION_BASE);
    if (url.origin !== VALIDATION_BASE) return null;
    const allowed = POST_LOGIN_PREFIXES.some(
      (p) => url.pathname === p || url.pathname.startsWith(`${p}/`),
    );
    return allowed ? url.pathname + url.search : null;
  } catch {
    return null;
  }
};
