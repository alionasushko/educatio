import { describe, expect, it } from "vitest";
import { HttpStatus } from "@nestjs/common";
import { multipartException } from "./multipart-error";

const answer = (code: string) => {
  const mapped = multipartException(Object.assign(new Error(code), { code }));
  if (!mapped) return null;
  const body = mapped.getResponse() as { code: string; message: string };
  return { status: mapped.getStatus(), code: body.code };
};

describe("how a rejected multipart request is answered", () => {
  it("answers 413 when the body carries more than one image", () => {
    for (const code of [
      "FST_REQ_FILE_TOO_LARGE",
      "FST_FILES_LIMIT",
      "FST_PARTS_LIMIT",
      "FST_FIELDS_LIMIT",
    ]) {
      expect(answer(code), code).toEqual({
        status: HttpStatus.PAYLOAD_TOO_LARGE,
        code: "file_too_large",
      });
    }
  });

  it("answers 400 when the request is not a usable multipart body", () => {
    for (const code of [
      "FST_INVALID_MULTIPART_CONTENT_TYPE",
      "FST_INVALID_JSON_FIELD_ERROR",
      "FST_PROTO_VIOLATION",
    ]) {
      expect(answer(code), code).toEqual({
        status: HttpStatus.BAD_REQUEST,
        code: "no_file",
      });
    }
  });

  it("leaves anything it does not recognise to the exception filter", () => {
    expect(answer("FST_FILE_BUFFER_NOT_FOUND")).toBeNull();
    expect(answer("ECONNRESET")).toBeNull();
    expect(multipartException(new Error("boom"))).toBeNull();
    expect(multipartException("not an error")).toBeNull();
  });
});
