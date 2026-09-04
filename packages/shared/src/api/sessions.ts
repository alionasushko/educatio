import { z } from "zod";

export const INVITE_CODE_MAX = 32;

export const SESSIONS_SEGMENT = "sessions";
export const STUDENT_SEGMENT = "student";
export const STUDENT_SESSION_PATH = `/${SESSIONS_SEGMENT}/${STUDENT_SEGMENT}`;

export const studentSessionSchema = z.object({
  inviteCode: z.string().trim().min(1).max(INVITE_CODE_MAX),
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(200),
});
export type StudentSessionInput = z.infer<typeof studentSessionSchema>;

export { sessionResponseSchema, type SessionResponse } from "./auth";
