import { describe, expect, it } from "vitest";
import {
  INVITE_CODE_MAX,
  studentSessionSchema,
} from "@educatio/shared/api/sessions";
import { checkForm } from "@/lib/form-validation";
import { JOIN_COPY } from "../helpers/constants";

const check = (input: Record<string, string>) =>
  checkForm(studentSessionSchema, input, JOIN_COPY);

const FILLED_IN = { name: "Sam", email: "sam@example.com" };

describe("joining a lesson", () => {
  it("tells the student the link is broken rather than doing nothing", () => {
    const checked = check({
      ...FILLED_IN,
      inviteCode: "A".repeat(INVITE_CODE_MAX + 1),
    });

    expect(checked.ok).toBe(false);
    if (checked.ok) return;
    expect(checked.errors.inviteCode).toBeTruthy();
  });

  it("does the same for an invite code the route left empty", () => {
    const checked = check({ ...FILLED_IN, inviteCode: "   " });

    expect(checked.ok).toBe(false);
    if (checked.ok) return;
    expect(checked.errors.inviteCode).toBeTruthy();
  });

  it("still reports the fields the student can actually fix", () => {
    const checked = check({
      inviteCode: "K7VZ9QM2XB",
      name: "  ",
      email: "not-an-email",
    });

    expect(checked.ok).toBe(false);
    if (checked.ok) return;
    expect(checked.errors.name).toBeTruthy();
    expect(checked.errors.email).toBeTruthy();
    expect(checked.errors.inviteCode).toBeUndefined();
  });

  it("accepts a well-formed join", () => {
    expect(check({ ...FILLED_IN, inviteCode: "K7VZ9QM2XB" }).ok).toBe(true);
  });
});
