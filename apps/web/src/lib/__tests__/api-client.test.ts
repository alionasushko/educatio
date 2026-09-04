// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const cookieStore = { get: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(cookieStore),
  headers: () => Promise.resolve(new Headers()),
}));
vi.mock("server-only", () => ({}));

import {
  ApiClientError,
  ApiResponseError,
  ApiTransportError,
  api,
} from "../api-client";

const ok = z.object({ ok: z.boolean() });

const answer = (
  body: unknown,
  init: { status?: number; statusText?: string } = {},
) =>
  vi.fn(() =>
    Promise.resolve(
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status: init.status ?? 200,
        statusText: init.statusText ?? "",
      }),
    ),
  );

const lastRequest = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls[0] as unknown as [string, RequestInit & { headers: Headers }];

beforeEach(() => {
  process.env.EDUCATIO_API_URL = "http://api.test";
  cookieStore.get.mockReset();
  cookieStore.get.mockReturnValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("what the api client puts on the wire", () => {
  it("sends no Authorization header when there is no session cookie", async () => {
    const fetchSpy = answer({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    await api.get("/lessons", { schema: ok });

    const [url, init] = lastRequest(fetchSpy);
    expect(url).toBe("http://api.test/lessons");
    expect(init.headers.get("Authorization")).toBeNull();
    expect(init.cache).toBe("no-store");
  });

  it("forwards the session cookie as a bearer token", async () => {
    cookieStore.get.mockReturnValue({ value: "jwt-value" });
    const fetchSpy = answer({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    await api.get("/lessons", { schema: ok });

    expect(lastRequest(fetchSpy)[1].headers.get("Authorization")).toBe(
      "Bearer jwt-value",
    );
  });

  it("sets a JSON content type for an object body", async () => {
    const fetchSpy = answer({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    await api.post("/lessons", { schema: ok, body: { title: "Algebra" } });

    const [, init] = lastRequest(fetchSpy);
    expect(init.headers.get("Content-Type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ title: "Algebra" }));
  });

  it("leaves the content type off FormData so fetch keeps the boundary", async () => {
    const fetchSpy = answer({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);
    const form = new FormData();
    form.append("file", new Blob(["x"]), "x.png");

    await api.post("/upload", { schema: ok, body: form });

    const [, init] = lastRequest(fetchSpy);
    expect(init.headers.get("Content-Type")).toBeNull();
    expect(init.body).toBe(form);
  });

  it("drops undefined query values and keeps the rest", async () => {
    const fetchSpy = answer({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    await api.get("/lessons", {
      schema: ok,
      query: { page: 2, status: undefined, q: "algebra & co" },
    });

    const [url] = lastRequest(fetchSpy);
    expect(url).toContain("page=2");
    expect(url).not.toContain("status");
    expect(url).toContain("q=algebra+%26+co");
  });
});

describe("how the api client reports a failure", () => {
  it("uses the api's own envelope when the error body is one", async () => {
    vi.stubGlobal(
      "fetch",
      answer({ code: "lesson_ended", message: "Over." }, { status: 403 }),
    );

    const err = await api.get("/lessons/1", { schema: ok }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect((err as ApiClientError).status).toBe(403);
    expect((err as ApiClientError).body.code).toBe("lesson_ended");
  });

  it("falls back to a code derived from the status when the body is not an envelope", async () => {
    vi.stubGlobal(
      "fetch",
      answer("<html>gateway</html>", { status: 404, statusText: "Not Found" }),
    );

    const err = await api.get("/lessons/1", { schema: ok }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect((err as ApiClientError).body).toEqual({
      code: "not_found",
      message: "Not Found",
    });
  });

  it("names a transport failure separately from an api refusal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("ECONNREFUSED"))),
    );

    const err = await api.get("/lessons", { schema: ok }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiTransportError);
    expect(err).not.toBeInstanceOf(ApiClientError);
  });

  it("refuses a 2xx whose body does not match the endpoint's schema", async () => {
    vi.stubGlobal("fetch", answer({ unexpected: true }));

    const err = await api.get("/lessons", { schema: ok }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiResponseError);
  });
});
