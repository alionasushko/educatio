import {
  BadRequestException,
  HttpException,
  PayloadTooLargeException,
} from "@nestjs/common";
import { MAX_UPLOAD_BYTES } from "@educatio/shared/api/upload";

export const UPLOAD_TOO_LARGE = `Images must be ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB or smaller.`;

const TOO_LARGE = new Set([
  "FST_REQ_FILE_TOO_LARGE",
  "FST_FILES_LIMIT",
  "FST_PARTS_LIMIT",
  "FST_FIELDS_LIMIT",
]);

const BAD_REQUEST = new Set([
  "FST_INVALID_MULTIPART_CONTENT_TYPE",
  "FST_INVALID_JSON_FIELD_ERROR",
  "FST_PROTO_VIOLATION",
]);

export const multipartException = (err: unknown): HttpException | null => {
  const code = (err as { code?: unknown }).code;
  if (typeof code !== "string") return null;

  if (code === "FST_REQ_FILE_TOO_LARGE" || code === "FST_FILES_LIMIT") {
    return new PayloadTooLargeException({
      code: "file_too_large",
      message: UPLOAD_TOO_LARGE,
    });
  }
  if (TOO_LARGE.has(code)) {
    return new PayloadTooLargeException({
      code: "file_too_large",
      message: "Send a single image and nothing else.",
    });
  }
  if (BAD_REQUEST.has(code)) {
    return new BadRequestException({
      code: "no_file",
      message: "Please choose a file to upload.",
    });
  }
  return null;
};
