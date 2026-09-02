import { describe, expect, it, vi, afterEach } from "vitest";
import { demoWindowMs } from "./auth.controller";
import { AuthService } from "./auth.service";

const withNodeEnv = (value: string | undefined, run: () => void) => {
  const before = process.env.NODE_ENV;
  if (value === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = value;
  try {
    run();
  } finally {
    process.env.NODE_ENV = before;
  }
};

const DAY = 24 * 60 * 60_000;

describe("how long a demo-account limit lasts", () => {
  it("uses the daily window anywhere that is not an explicit dev run", () => {
    withNodeEnv("production", () => expect(demoWindowMs()).toBe(DAY));
    withNodeEnv("test", () => expect(demoWindowMs()).toBe(DAY));
    withNodeEnv(undefined, () => expect(demoWindowMs()).toBe(DAY));
  });

  it("relaxes only when a developer opted in", () => {
    withNodeEnv("development", () => expect(demoWindowMs()).toBe(60_000));
  });
});

describe("the demo sweep", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not take the process down when mongo refuses it", async () => {
    const users = {
      find: () => ({
        limit: () => Promise.reject(new Error("connection reset")),
      }),
      create: () => Promise.resolve({ id: "u1", email: "d@x.invalid" }),
    };
    const service = new AuthService(
      users as never,
      {} as never,
      { signAsync: () => Promise.resolve("jwt") } as never,
      { get: (key: string) => key === "ENABLE_DEMO_LOGIN" } as never,
      { seedDemoLessons: () => Promise.resolve() } as never,
    );

    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      await expect(service.demoLogin()).resolves.toEqual({ sessionJwt: "jwt" });
      await new Promise((resolve) => setImmediate(resolve));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });
});
