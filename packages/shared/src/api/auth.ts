import { z } from "zod";

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

export const callbackSchema = z.object({
  token: z.string().min(1),
});
export type CallbackInput = z.infer<typeof callbackSchema>;

export const sentResponseSchema = z.object({ sent: z.literal(true) });
export type SentResponse = z.infer<typeof sentResponseSchema>;

export const sessionResponseSchema = z.object({ sessionJwt: z.string() });
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
