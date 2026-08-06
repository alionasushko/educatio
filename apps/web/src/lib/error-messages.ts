import type { ErrorCode } from "@educatio/shared/api/errors";

export type ClientErrorCode = ErrorCode | "unreachable";

export const ERROR_COPY: Record<ClientErrorCode, string> = {
  bad_request: "Something in that request wasn't right. Please try again.",
  unauthorized: "Your session has expired. Please sign in again.",
  forbidden: "You don't have access to that.",
  not_found: "We couldn't find what you were looking for.",
  conflict: "That conflicts with something that already exists.",
  too_many_requests: "Too many attempts. Please wait a moment and try again.",
  validation_error: "Please check the form and try again.",
  invalid_credentials: "Invalid email or password.",
  invalid_token: "That link is invalid or has expired.",
  invalid_id: "That link doesn't look right.",
  invalid_invite: "That invite code is invalid or has expired.",
  demo_disabled: "The demo isn't available right now.",
  demo_readonly: "The demo account can't make changes.",
  no_file: "Please choose a file to upload.",
  file_too_large: "That file is too large.",
  unsupported_type: "That file type isn't supported.",
  internal_error: "Something went wrong on our end. Please try again.",
  unreachable: "We couldn't reach the server. Please try again.",
};
