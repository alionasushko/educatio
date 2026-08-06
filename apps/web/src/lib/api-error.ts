import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { ErrorCode } from "@educatio/shared/api/errors";
import { ApiClientError, isApiFailure } from "./api-client";
import { ERROR_COPY } from "./error-messages";

export const query = async <T>(call: () => Promise<T>): Promise<T | null> => {
  try {
    return await call();
  } catch (err) {
    if (!isApiFailure(err)) throw err;
    console.error(err);
    return null;
  }
};

export const actionError = (
  err: unknown,
  byCode: Partial<Record<ErrorCode, string>> = {},
): { error: string } => {
  // Rethrows only Next's control-flow errors (redirect/notFound); a no-op otherwise.
  unstable_rethrow(err);

  if (err instanceof ApiClientError) {
    const { code } = err.body;
    if (code === "internal_error") console.error(err);
    return { error: byCode[code] ?? ERROR_COPY[code] };
  }

  console.error(err);
  return {
    error: isApiFailure(err)
      ? ERROR_COPY.unreachable
      : ERROR_COPY.internal_error,
  };
};
