import "server-only";
import { notFound, unstable_rethrow } from "next/navigation";
import { z, type ZodType } from "zod";
import type { ErrorCode } from "@educatio/shared/api/errors";
import { ApiClientError, ApiResponseError, isApiFailure } from "./api-client";
import { ERROR_COPY, type ClientErrorCode } from "./error-messages";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      /** Keyed on field name. Forms should prefer their own copy unless the
       *  schema curates its message (setPasswordSchema does). */
      fieldErrors?: Partial<Record<string, string>>;
    };

export interface QueryResult<T> {
  data: T | null;
  /** Why `data` is null, so the UI can key into ERROR_COPY or redirect. */
  code?: ClientErrorCode;
}

const failureCode = (err: unknown): ClientErrorCode => {
  if (err instanceof ApiClientError) return err.body.code;
  if (err instanceof ApiResponseError) return "malformed_response";
  return "unreachable";
};

/**
 * Run a read and degrade to null when the api fails, so the page still renders.
 * Returns the code too: without it a caller can only say "something went
 * wrong", and a mid-session `session_expired` can't send anyone to sign in.
 */
export const query = async <T>(
  call: () => Promise<T>,
): Promise<QueryResult<T>> => {
  try {
    return { data: await call() };
  } catch (err) {
    unstable_rethrow(err);
    if (!isApiFailure(err)) throw err;
    console.error(err);
    return { data: null, code: failureCode(err) };
  }
};

/**
 * For detail pages, where someone else's row and a missing one should look
 * identical — anything else is a real failure and belongs to the boundary.
 */
export const queryOrNotFound = async <T>(
  call: () => Promise<T>,
): Promise<T> => {
  try {
    return await call();
  } catch (err) {
    unstable_rethrow(err);
    if (
      err instanceof ApiClientError &&
      (err.body.code === "not_found" || err.body.code === "forbidden")
    ) {
      notFound();
    }
    throw err;
  }
};

/**
 * Parse a Server Action's input. The action re-parses even when the form
 * already did: an action is a public endpoint, so the client-side check is a
 * convenience, not a control.
 */
export const validated = <T>(
  schema: ZodType<T>,
  input: unknown,
): ActionResult<T> => {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };

  const flat = z.flattenError(parsed.error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(flat)) {
    const first = messages?.[0];
    if (first) fieldErrors[field] = first;
  }
  // Form-level copy comes from the map, never from Zod — most schemas have no
  // curated message, and their defaults are written for developers.
  return { ok: false, error: ERROR_COPY.validation_error, fieldErrors };
};

/**
 * Turn a thrown api failure into a value an action can return. Copy comes from
 * ERROR_COPY keyed on the api's stable `code`; `byCode` overrides it only where
 * a code reads differently in context.
 */
export const actionError = (
  err: unknown,
  byCode: Partial<Record<ErrorCode, string>> = {},
): ActionResult<never> => {
  unstable_rethrow(err);

  if (err instanceof ApiClientError) {
    const { code } = err.body;
    if (code === "internal_error") console.error(err);
    return { ok: false, error: byCode[code] ?? ERROR_COPY[code] };
  }

  console.error(err);
  return { ok: false, error: ERROR_COPY[failureCode(err)] };
};
