import { signupSchema } from "@educatio/shared/api/auth";
import type { Errors, Field } from "./types";

export const validate = (values: Record<Field, string>): Errors => {
  const result = signupSchema.safeParse({
    name: values.name.trim(),
    email: values.email.trim(),
    teaches: values.teaches.trim() || undefined,
  });
  if (result.success) return {};

  const flat = result.error.flatten().fieldErrors;
  const errors: Errors = {};
  if (flat.name) errors.name = "Please enter your name.";
  if (flat.email) errors.email = "Enter a valid email address.";
  if (flat.teaches) errors.teaches = "Keep this under 200 characters.";
  return errors;
};
