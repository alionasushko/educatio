import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { startApi, type Harness } from "./harness";
import {
  AUTH_ACTIONS,
  authPath,
  sessionResponseSchema,
} from "@educatio/shared/api/auth";
import { apiErrorSchema } from "@educatio/shared/api/errors";
import { LESSONS_PATH } from "@educatio/shared/api/lessons";

let api: Harness;

beforeAll(async () => {
  api = await startApi();
}, 120_000);

afterAll(async () => {
  await api?.close();
});

const post = async (token: string, body: unknown) => {
  const res = await fetch(`${api.baseUrl}${authPath(AUTH_ACTIONS.password)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return {
    status: res.status,
    data: text ? (JSON.parse(text) as unknown) : null,
  };
};

const stillWorks = async (token: string) =>
  (
    await fetch(`${api.baseUrl}${LESSONS_PATH}?page=1&limit=1&status=all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).status;

describe("setting a password for the first time", () => {
  it("asks for nothing else — there is no old password to give", async () => {
    const token = await api.newTutorJwt();
    const res = await post(token, { password: "a-long-enough-password" });

    expect(res.status).toBe(200);
    expect(sessionResponseSchema.safeParse(res.data).success).toBe(true);
  });
});

describe("changing one that already exists", () => {
  it("takes a recent session as proof, so magic-link recovery still works", async () => {
    const token = await api.newTutorJwt();
    const first = await post(token, { password: "the-first-password" });
    expect(first.status).toBe(200);
    const { sessionJwt } = sessionResponseSchema.parse(first.data);

    // The replacement session is also moments old, so still no old password.
    const again = await post(sessionJwt, { password: "the-second-password" });
    expect(again.status).toBe(200);
  });

  it("refuses an old session that cannot state the current password", async () => {
    const fresh = await api.newTutorJwt();
    const set = await post(fresh, { password: "the-real-password" });
    expect(set.status).toBe(200);

    // A session issued an hour ago that is otherwise perfectly valid.
    const stale = await api.staleFor(fresh);

    const blind = await post(stale, { password: "attacker-chosen-password" });
    expect(blind.status).toBe(401);
    expect(apiErrorSchema.parse(blind.data).code).toBe("invalid_credentials");

    const wrong = await post(stale, {
      password: "attacker-chosen-password",
      currentPassword: "not-the-real-one",
    });
    expect(wrong.status).toBe(401);

    const right = await post(stale, {
      password: "a-legitimate-new-password",
      currentPassword: "the-real-password",
    });
    expect(right.status).toBe(200);
  });
});

describe("what a change does to other sessions", () => {
  it("signs them out, and keeps the caller signed in", async () => {
    const token = await api.newTutorJwt();
    const elsewhere = await api.staleFor(token);
    expect(await stillWorks(elsewhere)).toBe(200);

    const res = await post(token, { password: "rotated-password-value" });
    expect(res.status).toBe(200);
    const { sessionJwt } = sessionResponseSchema.parse(res.data);

    // The session that was signed in on another device is gone...
    expect(await stillWorks(elsewhere)).toBe(401);
    // ...and so is the one that asked, replaced by the token it was handed.
    expect(await stillWorks(token)).toBe(401);
    expect(await stillWorks(sessionJwt)).toBe(200);
  });
});
