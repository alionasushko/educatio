import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startApi } from "./harness";
import type { Harness } from "./harness";

let api: Harness;

const signin = async (email: string) => {
  const res = await fetch(`${api.baseUrl}/auth/signin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return {
    status: res.status,
    body: (await res.json()) as Record<string, unknown>,
  };
};

beforeAll(async () => {
  api = await startApi();
});

afterAll(async () => {
  await api.close();
});

describe("what /auth/signin tells a stranger about who has an account", () => {
  it("answers the same for a registered address as for an unknown one", async () => {
    const known = await signin("tutor@example.com");
    const unknown = await signin("no-such-person@example.com");

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(known.status);
    expect(Object.keys(known.body).sort()).toEqual(
      Object.keys(unknown.body).sort(),
    );
    expect(known.body.sent).toBe(true);
  });

  it("still answers the same when email delivery fails", async () => {
    const restore = api.breakEmail();
    try {
      const known = await signin("tutor@example.com");
      const unknown = await signin("still-nobody@example.com");

      expect(known.status).toBe(200);
      expect(unknown.status).toBe(known.status);
      expect(Object.keys(known.body).sort()).toEqual(
        Object.keys(unknown.body).sort(),
      );
    } finally {
      restore();
    }
  });
});
