import { signupSchema } from "@educatio/shared/api/auth";
import { INVALID_EMAIL, checkForm } from "@/lib/form-validation";
import type { Errors, Field } from "./types";

const COPY = {
  name: "Please enter your name.",
  email: INVALID_EMAIL,
  teaches: "Keep this under 200 characters.",
};

export const validate = (values: Record<Field, string>): Errors => {
  const checked = checkForm(
    signupSchema,
    {
      name: values.name.trim(),
      email: values.email.trim(),
      teaches: values.teaches.trim() || undefined,
    },
    COPY,
  );
  return checked.ok ? {} : checked.errors;
};
