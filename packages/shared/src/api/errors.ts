import { z } from "zod";

/**
 * Every code the api can emit. It is the stable half of the error contract: the
 * api says what went wrong, each client decides how to say it. `message` is
 * written for a log — clients key on `code` and never render `message`.
 */
export const errorCodeSchema = z.enum([
  // Derived from the status when a throw site doesn't name a code.
  "bad_request",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "too_many_requests",
  "internal_error",
  // Named at the throw site.
  "validation_error",
  "invalid_credentials",
  "invalid_token",
  "invalid_id",
  "invalid_invite",
  "demo_disabled",
  "demo_readonly",
  "no_file",
  "file_too_large",
  "unsupported_type",
]);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** The code a response carries when no throw site named one. */
export const errorCodeFromStatus = (status: number): ErrorCode => {
  switch (status) {
    case 400:
      return "bad_request";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 429:
      return "too_many_requests";
    default:
      return "internal_error";
  }
};

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
