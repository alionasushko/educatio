import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentTutor, Session } from "../common/session.decorator";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ObjectIdPipe } from "../common/object-id.pipe";
import {
  createLessonSchema,
  listLessonsQuerySchema,
  updateLessonSchema,
  type CreateLessonInput,
  type ListLessonsQuery,
  type UpdateLessonInput,
} from "@educatio/shared/api/lessons";
import type { SessionClaims, TutorSessionClaims } from "@educatio/shared";
import { LESSONS_SEGMENT } from "@educatio/shared/api/lessons";

@Controller(LESSONS_SEGMENT)
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Post()
  create(
    @CurrentTutor() tutor: TutorSessionClaims,
    @Body(new ZodValidationPipe(createLessonSchema)) body: CreateLessonInput,
  ) {
    return this.lessons.create(tutor.sub, body);
  }

  @Get()
  list(
    @CurrentTutor() tutor: TutorSessionClaims,
    @Query(new ZodValidationPipe(listLessonsQuerySchema))
    query: ListLessonsQuery,
  ) {
    return this.lessons.list(tutor.sub, query);
  }

  @Get(":id")
  get(
    @Param("id", ObjectIdPipe) id: string,
    @Session() session: SessionClaims,
  ) {
    return this.lessons.getForSession(id, session);
  }

  @Patch(":id")
  update(
    @Param("id", ObjectIdPipe) id: string,
    @CurrentTutor() tutor: TutorSessionClaims,
    @Body(new ZodValidationPipe(updateLessonSchema)) body: UpdateLessonInput,
  ) {
    return this.lessons.update(id, tutor.sub, body);
  }

  @Delete(":id")
  remove(
    @Param("id", ObjectIdPipe) id: string,
    @CurrentTutor() tutor: TutorSessionClaims,
  ) {
    return this.lessons.delete(id, tutor.sub);
  }
}
