import { z } from "zod";

export const STUDENT_SESSION_PATH = "/sessions/student";

export const studentSessionSchema = z.object({
  inviteCode: z.string().min(1),
  name: z.string().min(1).max(120),
});
export type StudentSessionInput = z.infer<typeof studentSessionSchema>;

export { sessionResponseSchema, type SessionResponse } from "./auth";
