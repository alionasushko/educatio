import { z, type ZodType } from "zod";

export const INVALID_EMAIL = "Enter a valid email address.";

export const isUnfilled = (value: string): boolean => value.trim().length === 0;

type FieldName<T> = Extract<keyof T, string>;

export type FieldCopy<T> = Partial<Record<FieldName<T>, string>>;

export type CheckedForm<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldCopy<T>; firstInvalid?: FieldName<T> };

export const checkForm = <T>(
  schema: ZodType<T>,
  input: unknown,
  copy: FieldCopy<T>,
): CheckedForm<T> => {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };

  const failed = z.flattenError(parsed.error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const errors: FieldCopy<T> = {};
  let firstInvalid: FieldName<T> | undefined;

  for (const field of Object.keys(copy) as FieldName<T>[]) {
    if (!failed[field]?.length) continue;
    errors[field] = copy[field];
    firstInvalid ??= field;
  }

  return { ok: false, errors, firstInvalid };
};

export const focusField = (
  form: HTMLFormElement | null,
  name: string,
): void => {
  form?.querySelector<HTMLInputElement>(`[name="${name}"]`)?.focus();
};
