import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { SessionsService } from "./sessions.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
  SESSIONS_SEGMENT,
  STUDENT_SEGMENT,
  studentSessionSchema,
  type StudentSessionInput,
} from "@educatio/shared/api/sessions";

@Controller(SESSIONS_SEGMENT)
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post(STUDENT_SEGMENT)
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  createStudent(
    @Body(new ZodValidationPipe(studentSessionSchema))
    body: StudentSessionInput,
  ) {
    return this.sessions.createStudentSession(body);
  }
}
