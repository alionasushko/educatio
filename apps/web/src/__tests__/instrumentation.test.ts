import { afterEach, describe, expect, it, vi } from "vitest";

const init = vi.fn();
const captureRequestError = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  init: (...args: unknown[]) => init(...args),
  captureRequestError,
}));

const load = async (dsn?: string) => {
  vi.resetModules();
  init.mockClear();
  if (dsn === undefined) vi.stubEnv("SENTRY_DSN", "");
  else vi.stubEnv("SENTRY_DSN", dsn);
  return import("../instrumentation");
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("server instrumentation", () => {
  it("starts Sentry when a DSN is configured", async () => {
    const { register } = await load("https://public@o0.ingest.sentry.io/1");
    register();

    expect(init).toHaveBeenCalledTimes(1);
    expect(init.mock.calls[0]![0]).toMatchObject({
      dsn: "https://public@o0.ingest.sentry.io/1",
    });
  });

  it("stays out of the way when no DSN is configured", async () => {
    const { register } = await load();
    register();

    expect(init).not.toHaveBeenCalled();
  });

  it("hands server errors to Sentry", async () => {
    const { onRequestError } = await load(
      "https://public@o0.ingest.sentry.io/1",
    );
    expect(onRequestError).toBe(captureRequestError);
  });
});
