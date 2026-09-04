import { z } from "zod";

export const tutorSessionClaimsSchema = z.object({
  kind: z.literal("tutor"),
  sub: z.string(),
  email: z.string(),
  tokenVersion: z.number().optional(),
  iat: z.number(),
  exp: z.number(),
});

export const studentSessionClaimsSchema = z.object({
  kind: z.literal("student"),
  lessonId: z.string(),
  name: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export const sessionClaimsSchema = z.discriminatedUnion("kind", [
  tutorSessionClaimsSchema,
  studentSessionClaimsSchema,
]);

export type TutorSessionClaims = z.infer<typeof tutorSessionClaimsSchema>;
export type StudentSessionClaims = z.infer<typeof studentSessionClaimsSchema>;
export type SessionClaims = z.infer<typeof sessionClaimsSchema>;

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  teaches?: string;
  hasPassword: boolean;
  isDemo: boolean;
  requiresCurrentPassword: boolean;
}
