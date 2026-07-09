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
