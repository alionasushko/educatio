import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
  studentSessionSchema,
  type StudentSessionInput,
} from "@educatio/shared/api/sessions";

@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post("student")
  @HttpCode(200)
  createStudent(
    @Body(new ZodValidationPipe(studentSessionSchema))
    body: StudentSessionInput,
  ) {
    return this.sessions.createStudentSession(body);
  }
}
