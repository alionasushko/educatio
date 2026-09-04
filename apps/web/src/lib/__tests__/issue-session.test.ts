// @vitest-environment node

import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "a-test-secret-that-is-at-least-32-characters";
const key = new TextEncoder().encode(SECRET);

const sign = (
  claims: Record<string, unknown>,
  expiresIn = "1h",
): Promise<string> =>
  new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);

interface Written {
  name: string;
  value: string;
  options: { maxAge?: number; httpOnly?: boolean; sameSite?: string };
}

const written: Written[] = [];

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      set: (name: string, value: string, options: Written["options"]) => {
        written.push({ name, value, options });
      },
    }),
}));

const load = async () => {
  process.env.AUTH_JWT_SECRET = SECRET;
  return import("@/lib/issue-session");
};

beforeEach(() => {
  written.length = 0;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("issuing a session cookie", () => {
  it("writes nothing when the token cannot be verified", async () => {
    const { issueSessionCookie } = await load();
    const forged = await new SignJWT({ kind: "tutor", sub: "u1" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("a-different-secret-of-sufficient-len"));

    expect(await issueSessionCookie(forged, "tutor")).toBeNull();
    expect(written).toHaveLength(0);
  });

  it("writes nothing when the token has expired", async () => {
    const { issueSessionCookie } = await load();
    const stale = await sign(
      { kind: "tutor", sub: "u1", email: "t@example.com" },
      "-1h",
    );

    expect(await issueSessionCookie(stale, "tutor")).toBeNull();
    expect(written).toHaveLength(0);
  });

  it("refuses a token whose kind is not the one asked for", async () => {
    const { issueSessionCookie } = await load();
    const studentToken = await sign({
      kind: "student",
      lessonId: "6512f1a2b3c4d5e6f7a8b9c0",
      name: "Sam",
    });

    expect(await issueSessionCookie(studentToken, "tutor")).toBeNull();
    expect(written).toHaveLength(0);
  });

  it("derives maxAge from the token's own exp, not the 30-day default", async () => {
    const { issueSessionCookie } = await load();
    const token = await sign(
      { kind: "tutor", sub: "u1", email: "t@example.com" },
      "1h",
    );

    const claims = await issueSessionCookie(token, "tutor");
    expect(claims?.kind).toBe("tutor");
    expect(written).toHaveLength(1);

    const { options, value } = written[0]!;
    expect(value).toBe(token);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.maxAge).toBeGreaterThan(0);
    expect(options.maxAge).toBeLessThanOrEqual(60 * 60);
  });
});
