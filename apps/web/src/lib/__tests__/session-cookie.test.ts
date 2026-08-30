import { afterEach, describe, expect, it, vi } from "vitest";

const loadOptions = async (nodeEnv: string) => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  return import("../session");
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("session cookie options", () => {
  it("marks the cookie Secure in production", async () => {
    const { sessionCookieOptions, postLoginCookieOptions } =
      await loadOptions("production");

    expect(sessionCookieOptions.secure).toBe(true);
    expect(postLoginCookieOptions.secure).toBe(true);
  });

  it("drops Secure outside production so http://localhost can hold it", async () => {
    const { sessionCookieOptions } = await loadOptions("development");

    expect(sessionCookieOptions.secure).toBe(false);
  });

  it("keeps httpOnly and SameSite on in every environment", async () => {
    for (const nodeEnv of ["production", "development", "test"]) {
      const { sessionCookieOptions, postLoginCookieOptions } =
        await loadOptions(nodeEnv);

      for (const options of [sessionCookieOptions, postLoginCookieOptions]) {
        expect(options.httpOnly).toBe(true);
        expect(options.sameSite).toBe("lax");
        expect(options.path).toBe("/");
      }
    }
  });

  it("derives a lifetime from the token's own expiry", async () => {
    const { sessionCookieOptionsFor } = await loadOptions("production");
    const inAnHour = Math.floor(Date.now() / 1000) + 3600;

    const options = sessionCookieOptionsFor(inAnHour);
    expect(options.secure).toBe(true);
    expect(options.maxAge).toBeGreaterThan(3500);
    expect(options.maxAge).toBeLessThanOrEqual(3600);
  });

  it("never asks the browser to keep an already-expired token", async () => {
    const { sessionCookieOptionsFor } = await loadOptions("production");
    const anHourAgo = Math.floor(Date.now() / 1000) - 3600;

    expect(sessionCookieOptionsFor(anHourAgo).maxAge).toBe(0);
  });
});
