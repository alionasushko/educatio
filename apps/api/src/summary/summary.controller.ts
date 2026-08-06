import { Controller, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { SummaryService } from "./summary.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentTutor } from "../common/session.decorator";
import { ObjectIdPipe } from "../common/object-id.pipe";
import type { TutorSessionClaims } from "@educatio/shared";
import { LESSONS_SEGMENT } from "@educatio/shared/api/lessons";
import { SUMMARY_SEGMENT } from "@educatio/shared/api/summary";

@Controller(`${LESSONS_SEGMENT}/:lessonId/${SUMMARY_SEGMENT}`)
@UseGuards(JwtAuthGuard)
export class SummaryController {
  constructor(private readonly summary: SummaryService) {}

  @Post()
  @HttpCode(200)
  generate(
    @Param("lessonId", ObjectIdPipe) lessonId: string,
    @CurrentTutor() tutor: TutorSessionClaims,
  ) {
    return this.summary.generate(lessonId, tutor.sub);
  }
}
