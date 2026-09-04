// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ unstable_rethrow: () => undefined }));

import { ApiClientError } from "../api-client";
import { actionError } from "../api-error";

const refusal = (code: string) =>
  new ApiClientError("POST", "/auth/password", 401, {
    code,
    message: "from the api",
  } as never);

describe("turning an api refusal into something a form can render", () => {
  it("puts a coded message on the field it belongs to", () => {
    const result = actionError(refusal("invalid_credentials"), {
      invalid_credentials: {
        message: "Your current password is incorrect.",
        field: "currentPassword",
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors).toEqual({
      currentPassword: "Your current password is incorrect.",
    });
    expect(result.error).toBe("Your current password is incorrect.");
  });

  it("still accepts a plain string, which stays form-level", () => {
    const result = actionError(refusal("invalid_credentials"), {
      invalid_credentials: "Those details did not match.",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("Those details did not match.");
    expect(result.fieldErrors).toBeUndefined();
  });

  it("falls back to the shared copy for a code it was not given", () => {
    const result = actionError(refusal("not_found"), {});

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeTruthy();
    expect(result.fieldErrors).toBeUndefined();
  });
});
