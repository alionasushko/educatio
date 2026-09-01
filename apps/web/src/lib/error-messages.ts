import type { ErrorCode } from "@educatio/shared/api/errors";

// Two web-side pseudo-codes for failures that never reach the api's contract:
// the request didn't complete, and the 2xx body didn't match its endpoint.
export type ClientErrorCode = ErrorCode | "unreachable" | "malformed_response";

export const ERROR_COPY: Record<ClientErrorCode, string> = {
  bad_request: "Something in that request wasn't right. Please try again.",
  unauthorized: "Your session has expired. Please sign in again.",
  forbidden: "You don't have access to that.",
  not_found: "We couldn't find what you were looking for.",
  conflict: "That conflicts with something that already exists.",
  too_many_requests: "Too many attempts. Please wait a moment and try again.",
  validation_error: "Please check the form and try again.",
  invalid_credentials: "Invalid email or password.",
  session_expired: "Your session has expired. Please sign in again.",
  service_unavailable:
    "That feature is temporarily unavailable. Please try again shortly.",
  invalid_token: "That link is invalid or has expired.",
  invalid_id: "That link doesn't look right.",
  invalid_invite: "That invite code is invalid or has expired.",
  demo_disabled: "The demo isn't available right now.",
  limit_reached: "You've reached the limit for a demo account.",
  no_file: "Please choose a file to upload.",
  file_too_large: "That file is too large.",
  unsupported_type: "That file type isn't supported.",
  internal_error: "Something went wrong on our end. Please try again.",
  unreachable: "We couldn't reach the server. Please try again.",
  // Distinct from `unreachable`: the server answered, we couldn't use it. The
  // user sees the same class of message, but logs and Sentry can tell them apart.
  malformed_response: "Something went wrong on our end. Please try again.",
};
