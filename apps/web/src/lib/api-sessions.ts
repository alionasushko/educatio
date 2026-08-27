import "server-only";
import {
  STUDENT_SESSION_PATH,
  sessionResponseSchema,
  type SessionResponse,
  type StudentSessionInput,
} from "@educatio/shared/api/sessions";
import { api } from "./api-client";

export const createStudentSession = (input: StudentSessionInput) =>
  api.post<SessionResponse>(STUDENT_SESSION_PATH, {
    schema: sessionResponseSchema,
    body: input,
    ip: true,
  });
