import { describe, expect, it, vi, beforeEach } from "vitest";

const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
const notFound = vi.fn(() => {
  throw new Error("NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  redirect,
  notFound,
  unstable_rethrow: () => undefined,
}));

const { ApiClientError } = await import("../api-client");
const { query, queryOrNotFound } = await import("../api-error");

const failing =
  (code: string, status = 401) =>
  () =>
    Promise.reject(
      new ApiClientError("GET", "/auth/me", status, {
        code: code as never,
        message: "nope",
      }),
    );

beforeEach(() => {
  redirect.mockClear();
  notFound.mockClear();
});

describe("a session the api no longer accepts", () => {
  it("sends the reader to sign in again", async () => {
    await expect(query(failing("session_expired"))).rejects.toThrow(
      "REDIRECT:/auth/expired",
    );
    expect(redirect).toHaveBeenCalledWith("/auth/expired");
  });

  it("treats a bare unauthorized the same way", async () => {
    await expect(query(failing("unauthorized"))).rejects.toThrow(
      "REDIRECT:/auth/expired",
    );
  });

  it("redirects from detail pages too, rather than showing a 404", async () => {
    await expect(queryOrNotFound(failing("session_expired"))).rejects.toThrow(
      "REDIRECT:/auth/expired",
    );
    expect(notFound).not.toHaveBeenCalled();
  });
});

describe("other failures still degrade instead of redirecting", () => {
  it("keeps a not_found on a detail page as a 404", async () => {
    await expect(queryOrNotFound(failing("not_found", 404))).rejects.toThrow(
      "NOT_FOUND",
    );
    expect(redirect).not.toHaveBeenCalled();
  });

  it("lets a page render without its data when the api is down", async () => {
    const result = await query(failing("internal_error", 500));

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toEqual({ data: null, code: "internal_error" });
  });
});
