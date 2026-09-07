import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "../security-headers";

const directive = (csp: string, name: string): string => {
  const found = csp
    .split("; ")
    .find((part) => part === name || part.startsWith(`${name} `));
  if (found === undefined) throw new Error(`no ${name} directive in: ${csp}`);
  return found;
};

const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.public.blob.vercel-storage.com",
  "font-src 'self'",
  "connect-src 'self' https://*.liveblocks.io wss://*.liveblocks.io",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

describe("the headers production actually sends", () => {
  it("is exactly this set, values included", () => {
    expect(securityHeaders(false)).toEqual([
      { key: "Content-Security-Policy", value: PRODUCTION_CSP },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ]);
  });
});

describe("what the production script-src allows", () => {
  it("lets the PDF export compile its WebAssembly", () => {
    expect(directive(contentSecurityPolicy(false), "script-src")).toContain(
      "'wasm-unsafe-eval'",
    );
  });

  it("still refuses to eval JavaScript", () => {
    expect(directive(contentSecurityPolicy(false), "script-src")).not.toContain(
      "'unsafe-eval'",
    );
  });
});

describe("what dev adds on top", () => {
  it("allows eval, which Next's dev server needs", () => {
    expect(directive(contentSecurityPolicy(true), "script-src")).toContain(
      "'unsafe-eval'",
    );
  });

  it("allows the dev websocket", () => {
    expect(directive(contentSecurityPolicy(true), "connect-src")).toContain(
      "ws://localhost:3000",
    );
  });

  it("keeps both out of production", () => {
    expect(contentSecurityPolicy(false)).not.toContain("localhost");
    expect(securityHeaders(true).map((header) => header.key)).not.toContain(
      "Strict-Transport-Security",
    );
  });

  it("changes nothing else about the policy", () => {
    const only = (csp: string) =>
      csp
        .split("; ")
        .filter(
          (part) =>
            !part.startsWith("script-src") && !part.startsWith("connect-src"),
        );
    expect(only(contentSecurityPolicy(true))).toEqual(
      only(contentSecurityPolicy(false)).filter(
        (part) => part !== "upgrade-insecure-requests",
      ),
    );
  });
});

describe("the Sentry origin", () => {
  it("is allowed to connect when a DSN is configured", () => {
    const csp = contentSecurityPolicy(
      false,
      "https://abc@o123.ingest.sentry.io/456",
    );
    expect(directive(csp, "connect-src")).toContain(
      "https://o123.ingest.sentry.io",
    );
  });

  it("widens nothing when the DSN is absent or unparseable", () => {
    const none = directive(contentSecurityPolicy(false), "connect-src");
    expect(
      directive(contentSecurityPolicy(false, "not-a-url"), "connect-src"),
    ).toBe(none);
  });

  it("ignores a DSN that is not https, rather than admitting `null`", () => {
    const none = directive(contentSecurityPolicy(false), "connect-src");
    for (const hostile of [
      "data:text/plain,x",
      "javascript:alert(1)",
      "file:///x",
    ]) {
      expect(
        directive(contentSecurityPolicy(false, hostile), "connect-src"),
      ).toBe(none);
    }
  });

  it("admits only the origin, never a path or credentials from the DSN", () => {
    const csp = contentSecurityPolicy(
      false,
      "https://key@o1.ingest.sentry.io/4507?x=1",
    );
    expect(directive(csp, "connect-src")).toContain(
      "https://o1.ingest.sentry.io",
    );
    expect(csp).not.toContain("key@");
    expect(csp).not.toContain("4507");
  });
});
