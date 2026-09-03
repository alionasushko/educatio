// @vitest-environment node

import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";

const SECRET = "a-test-secret-that-is-at-least-32-characters";
const ANY_ORIGIN = "http://localhost:3000";
const LESSON = "6512f1a2b3c4d5e6f7a8b9c0";
const OTHER_LESSON = "aaaabbbbccccddddeeeeffff";

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

const tutor = () => sign({ kind: "tutor", sub: "u1", email: "t@example.com" });
const student = (lessonId = LESSON) =>
  sign({ kind: "student", lessonId, name: "Sam" });

interface Outcome {
  redirectedTo: string | null;
}

let visit: (path: string, token?: string) => Promise<Outcome>;

beforeAll(async () => {
  process.env.AUTH_JWT_SECRET = SECRET;
  const { default: proxy } = await import("../proxy");

  visit = async (path, token) => {
    const request = new NextRequest(new URL(path, ANY_ORIGIN), {
      headers: token ? { cookie: `educatio_session=${token}` } : {},
    });
    const response = await proxy(request);
    const location = response.headers.get("location");
    return {
      redirectedTo: location
        ? new URL(location).pathname + new URL(location).search
        : null,
    };
  };
});

describe("who the gate turns away", () => {
  it("sends a visitor with no session to sign in, remembering where they were going", async () => {
    expect((await visit("/dashboard")).redirectedTo).toBe(
      "/sign-in?callbackUrl=%2Fdashboard",
    );
  });

  it("sends a visitor with an unreadable token to sign in", async () => {
    expect((await visit("/dashboard", "not-a-jwt")).redirectedTo).toBe(
      "/sign-in?callbackUrl=%2Fdashboard",
    );
  });

  it("rejects a token signed with someone else's secret", async () => {
    const forged = await new SignJWT({
      kind: "tutor",
      sub: "u1",
      email: "t@example.com",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(
        new TextEncoder().encode("a-different-secret-of-sufficient-length"),
      );

    expect((await visit("/dashboard", forged)).redirectedTo).toBe(
      "/sign-in?callbackUrl=%2Fdashboard",
    );
  });

  it("rejects an expired token", async () => {
    const stale = await sign(
      { kind: "tutor", sub: "u1", email: "t@example.com" },
      "-1h",
    );
    expect((await visit("/dashboard", stale)).redirectedTo).toBe(
      "/sign-in?callbackUrl=%2Fdashboard",
    );
  });

  it("rejects a student token carrying no lesson", async () => {
    expect((await visit("/lesson/x", await student(""))).redirectedTo).toBe(
      "/sign-in?callbackUrl=%2Flesson%2Fx",
    );
  });
});

describe("where a tutor may go", () => {
  it("lets a tutor through everywhere the gate covers", async () => {
    const token = await tutor();
    for (const path of [
      "/dashboard",
      "/settings",
      "/set-password",
      "/lesson/new",
      `/lesson/${LESSON}`,
      `/lesson/${LESSON}/summary`,
    ]) {
      expect((await visit(path, token)).redirectedTo, path).toBeNull();
    }
  });
});

describe("where a student may go", () => {
  it("lets a student into their own room and its summary", async () => {
    const token = await student();
    for (const path of [`/lesson/${LESSON}`, `/lesson/${LESSON}/summary`]) {
      expect((await visit(path, token)).redirectedTo, path).toBeNull();
    }
  });

  it("turns a student back from anything that is not their room", async () => {
    const token = await student();
    for (const path of [
      "/dashboard",
      "/settings",
      "/set-password",
      "/lesson/new",
      `/lesson/${OTHER_LESSON}`,
      `/lesson/${OTHER_LESSON}/summary`,
      `/lesson/${LESSON}/edit`,
      `/lesson/${LESSON}/summary/print`,
    ]) {
      expect((await visit(path, token)).redirectedTo, path).toBe(
        `/lesson/${LESSON}`,
      );
    }
  });

  it("is not fooled by an encoded lesson id", async () => {
    const token = await student();
    const encoded = `/lesson/${encodeURIComponent(LESSON)}`;
    expect((await visit(encoded, token)).redirectedTo).toBeNull();
  });
});
