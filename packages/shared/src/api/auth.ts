import { z } from "zod";

const utf8ByteLength = (value: string): number =>
  Array.from(value).reduce((total, char) => {
    const cp = char.codePointAt(0) ?? 0;
    return total + (cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4);
  }, 0);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine((v) => utf8ByteLength(v) <= 72, {
    message: "Password must be at most 72 bytes.",
  });

export const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  teaches: z.string().max(200).optional(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
  email: z.string().email(),
});
export type SigninInput = z.infer<typeof signinSchema>;

export const passwordSigninSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});
export type PasswordSigninInput = z.infer<typeof passwordSigninSchema>;

export const setPasswordSchema = z.object({
  password: passwordSchema,
});
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

export const callbackSchema = z.object({
  token: z.string().min(1),
});
export type CallbackInput = z.infer<typeof callbackSchema>;

export const sentResponseSchema = z.object({ sent: z.literal(true) });
export type SentResponse = z.infer<typeof sentResponseSchema>;

export const sessionResponseSchema = z.object({ sessionJwt: z.string() });
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
