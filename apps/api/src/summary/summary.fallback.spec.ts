import { describe, expect, it, vi, beforeEach } from "vitest";

const generateText = vi.fn();
vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => generateText(...args),
}));
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: () => (model: string) => ({ model }),
}));

import {
  SummaryService,
  SUMMARY_MODELS,
  isCapacityError,
} from "./summary.service";

const overloaded = () =>
  Object.assign(new Error("high demand"), {
    lastError: { statusCode: 503, isRetryable: true },
  });

const badKey = () =>
  Object.assign(new Error("API key not valid"), {
    statusCode: 400,
    isRetryable: false,
  });

// Queued per call rather than as a persistent implementation: vitest reports a
// persistent throwing mock as an unhandled error even when the caller catches it.
const throwsOnce = (err: Error) =>
  generateText.mockImplementationOnce(() => {
    throw err;
  });

const resolvesOnce = (text: string) =>
  generateText.mockImplementationOnce(() => ({ text }));

const headroom = { increment: async () => ({ isBlocked: false }) } as never;

const service = (key: string | undefined) =>
  new SummaryService(
    {} as never,
    {} as never,
    { get: () => key } as never,
    headroom,
  );

const callModel = (svc: SummaryService) =>
  (svc as unknown as { callModel: (p: string) => Promise<string> }).callModel(
    "prompt",
  );

const rejection = async (run: () => Promise<unknown>): Promise<unknown> => {
  try {
    await run();
  } catch (err) {
    return err;
  }
  throw new Error("expected the call to reject");
};

describe("isCapacityError", () => {
  it("treats an overloaded model as worth failing over", () => {
    expect(isCapacityError(overloaded())).toBe(true);
    expect(isCapacityError({ statusCode: 429, isRetryable: true })).toBe(true);
    expect(isCapacityError({ statusCode: 500 })).toBe(true);
  });

  it("does not fail over on a bad key or malformed request", () => {
    expect(isCapacityError(badKey())).toBe(false);
    expect(isCapacityError({ statusCode: 403, isRetryable: false })).toBe(
      false,
    );
    expect(isCapacityError(new Error("boom"))).toBe(false);
  });
});

describe("summary model fallback", () => {
  beforeEach(() => generateText.mockReset());

  it("falls through to the next model when the first is overloaded", async () => {
    throwsOnce(overloaded());
    resolvesOnce("written by the fallback");

    await expect(callModel(service("k"))).resolves.toBe(
      "written by the fallback",
    );
    expect(generateText).toHaveBeenCalledTimes(2);
    expect(generateText.mock.calls[0]![0].model.model).toBe(SUMMARY_MODELS[0]);
    expect(generateText.mock.calls[1]![0].model.model).toBe(SUMMARY_MODELS[1]);
  });

  it("does not burn the fallback on a bad key", async () => {
    throwsOnce(badKey());
    // Would succeed if the code wrongly fell through, so the call count is proof.
    resolvesOnce("must not be reached");

    const err = await rejection(() => callModel(service("k")));
    expect((err as { statusCode: number }).statusCode).toBe(400);
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it("surfaces the last error when every model is overloaded", async () => {
    SUMMARY_MODELS.forEach(() => throwsOnce(overloaded()));

    const err = await rejection(() => callModel(service("k")));
    expect((err as Error).message).toMatch(/high demand/);
    expect(generateText).toHaveBeenCalledTimes(SUMMARY_MODELS.length);
  });

  it("answers 503 when no key is configured", async () => {
    const err = await rejection(() => callModel(service(undefined)));
    expect((err as { status: number }).status).toBe(503);
    expect(generateText).not.toHaveBeenCalled();
  });
});

describe("a lesson that already has a summary", () => {
  const withStoredSummary = () => {
    generateText.mockClear();
    const generatedAt = new Date("2026-03-04T10:00:00.000Z");
    const lesson = { summary: { text: "stored summary", generatedAt } };
    const latest = vi.fn();
    const svc = new SummaryService(
      { getOwnedOr403: async () => lesson } as never,
      { latest } as never,
      { get: () => "key" } as never,
      headroom,
    );
    return { svc, latest, generatedAt };
  };

  it("returns what was stored instead of paying for it again", async () => {
    const { svc, generatedAt } = withStoredSummary();

    await expect(svc.generate("lesson", "tutor")).resolves.toEqual({
      summary: {
        text: "stored summary",
        generatedAt: generatedAt.toISOString(),
      },
    });
    expect(generateText).not.toHaveBeenCalled();
  });

  it("does not even read the canvas", async () => {
    const { svc, latest } = withStoredSummary();

    await svc.generate("lesson", "tutor");
    expect(latest).not.toHaveBeenCalled();
  });
});
