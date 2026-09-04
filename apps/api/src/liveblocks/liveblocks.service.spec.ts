import { describe, expect, it, vi } from "vitest";

const authorize = vi.fn();
const allow = vi.fn();
vi.mock("@liveblocks/node", () => ({
  Liveblocks: class {
    prepareSession() {
      return { allow, FULL_ACCESS: "room:write", authorize };
    }
  },
}));

import { LiveblocksService } from "./liveblocks.service";

const ROOM = "lesson_abc";

const service = () => {
  const lesson = {
    id: "lesson1",
    tutorId: { toString: () => "tutor1" },
    status: "active",
  };
  return new LiveblocksService(
    {
      findByRoomOr404: async () => lesson,
      assertCanWrite: () => undefined,
    } as never,
    { get: () => "sk_test" } as never,
  );
};

const tutor = { kind: "tutor", sub: "tutor1", email: "t@example.com" } as never;

const rejection = async (run: () => Promise<unknown>): Promise<unknown> => {
  try {
    await run();
  } catch (err) {
    return err;
  }
  throw new Error("expected the call to reject");
};

describe("when Liveblocks will not issue a room token", () => {
  it("answers 503 rather than 500 when it reports a non-200", async () => {
    authorize.mockResolvedValueOnce({
      status: 401,
      body: '{"error":"forbidden"}',
    });

    const err = await rejection(() => service().authorize(tutor, ROOM));
    expect((err as { status: number }).status).toBe(503);
    expect((err as { response: { code: string } }).response.code).toBe(
      "service_unavailable",
    );
  });

  it("answers 503 when it reports an error alongside a 200", async () => {
    authorize.mockResolvedValueOnce({
      status: 200,
      body: "",
      error: new Error("socket hang up"),
    });

    const err = await rejection(() => service().authorize(tutor, ROOM));
    expect((err as { status: number }).status).toBe(503);
  });

  it("answers 503 rather than a JSON.parse crash on a non-JSON body", async () => {
    authorize.mockResolvedValueOnce({ status: 200, body: "<html>502</html>" });

    const err = await rejection(() => service().authorize(tutor, ROOM));
    expect((err as { status: number }).status).toBe(503);
  });

  it("still returns the token when Liveblocks answers properly", async () => {
    authorize.mockResolvedValueOnce({ status: 200, body: '{"token":"jwt"}' });

    await expect(service().authorize(tutor, ROOM)).resolves.toEqual({
      token: "jwt",
    });
  });
});
