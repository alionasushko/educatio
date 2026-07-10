import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session";
import { requireApiUrl } from "./api-base";
import type { ApiError } from "@educatio/shared/api/errors";

const REQUEST_TIMEOUT_MS = 30_000;

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError,
  ) {
    super(body.message);
    this.name = "ApiClientError";
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  const headers = new Headers(init?.headers);
  if (init?.body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${requireApiUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: init?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw new ApiClientError(
      res.status,
      (data as ApiError | null) ?? {
        code: "error",
        message: res.statusText,
      },
    );
  }
  return data as T;
};

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};
