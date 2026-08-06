import { z } from "zod";

export const SESSIONS_SEGMENT = "sessions";
export const STUDENT_SEGMENT = "student";
export const STUDENT_SESSION_PATH = `/${SESSIONS_SEGMENT}/${STUDENT_SEGMENT}`;

export const studentSessionSchema = z.object({
  inviteCode: z.string().min(1),
  name: z.string().min(1).max(120),
});
export type StudentSessionInput = z.infer<typeof studentSessionSchema>;

export { sessionResponseSchema, type SessionResponse } from "./auth";
