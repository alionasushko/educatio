import "server-only";
import { cookies } from "next/headers";
import type { ZodType } from "zod";
import { SESSION_COOKIE } from "./session";
import { requireApiUrl } from "./api-base";
import { forwardedIpHeaders } from "./client-ip";
import {
  apiErrorSchema,
  errorCodeFromStatus,
} from "@educatio/shared/api/errors";
import type { ApiError } from "@educatio/shared/api/errors";

const REQUEST_TIMEOUT_MS = 30_000;

type Method = "GET" | "POST" | "PATCH" | "DELETE";
type QueryValue = string | number | boolean | undefined;

interface RequestOptions<T> {
  body?: unknown;
  query?: Record<string, QueryValue>;
  ip?: boolean;
  schema?: ZodType<T>;
}

export class ApiClientError extends Error {
  constructor(
    readonly method: string,
    readonly path: string,
    readonly status: number,
    readonly body: ApiError,
  ) {
    super(`${method} ${path} → ${status} ${body.code}: ${body.message}`);
    this.name = "ApiClientError";
  }
}

export class ApiTransportError extends Error {
  constructor(
    readonly method: string,
    readonly path: string,
    override readonly cause: unknown,
  ) {
    super(`${method} ${path} → unreachable`);
    this.name = "ApiTransportError";
  }
}

export class ApiResponseError extends Error {
  constructor(
    readonly method: string,
    readonly path: string,
    override readonly cause: unknown,
  ) {
    super(`${method} ${path} → malformed response`);
    this.name = "ApiResponseError";
  }
}

export const isApiFailure = (
  err: unknown,
): err is ApiClientError | ApiTransportError | ApiResponseError =>
  err instanceof ApiClientError ||
  err instanceof ApiTransportError ||
  err instanceof ApiResponseError;

export const url = (
  segments: TemplateStringsArray,
  ...values: (string | number)[]
): string =>
  segments.reduce(
    (acc, segment, i) =>
      acc +
      segment +
      (i < values.length ? encodeURIComponent(String(values[i])) : ""),
    "",
  );

const buildQuery = (query?: Record<string, QueryValue>): string => {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const request = async <T>(
  method: Method,
  path: string,
  opts: RequestOptions<T> = {},
): Promise<T> => {
  const store = await cookies();
  const url = `${requireApiUrl()}${path}${buildQuery(opts.query)}`;

  const headers = new Headers();
  if (opts.body !== undefined) headers.set("Content-Type", "application/json");
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (opts.ip) {
    for (const [key, value] of Object.entries(await forwardedIpHeaders())) {
      headers.set(key, value);
    }
  }

  let res: Response;
  let text: string;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    text = await res.text();
  } catch (cause) {
    throw new ApiTransportError(method, path, cause);
  }

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(data);
    const body: ApiError = parsed.success
      ? parsed.data
      : {
          code: errorCodeFromStatus(res.status),
          message: res.statusText || "Request failed",
        };
    throw new ApiClientError(method, path, res.status, body);
  }

  if (opts.schema) {
    const parsed = opts.schema.safeParse(data);
    if (!parsed.success) throw new ApiResponseError(method, path, parsed.error);
    return parsed.data;
  }
  return data as T;
};

export const api = {
  get: <T>(path: string, opts?: RequestOptions<T>) =>
    request<T>("GET", path, opts),
  post: <T>(path: string, opts?: RequestOptions<T>) =>
    request<T>("POST", path, opts),
  patch: <T>(path: string, opts?: RequestOptions<T>) =>
    request<T>("PATCH", path, opts),
  del: <T>(path: string, opts?: RequestOptions<T>) =>
    request<T>("DELETE", path, opts),
};
