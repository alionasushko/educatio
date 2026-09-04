import type { StudentSessionInput } from "@educatio/shared/api/sessions";
import { ERROR_COPY } from "@/lib/error-messages";
import type { FieldCopy } from "@/lib/form-validation";

export const JOIN_COPY: Required<FieldCopy<StudentSessionInput>> = {
  inviteCode: ERROR_COPY.invalid_invite,
  name: "Add your name so your tutor knows who joined.",
  email: "Enter a valid email address.",
};
