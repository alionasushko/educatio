import { Controller, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { SummaryService } from "./summary.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentTutor } from "../common/session.decorator";
import type { TutorSessionClaims } from "@educatio/shared";

@Controller("lessons/:lessonId/summary")
@UseGuards(JwtAuthGuard)
export class SummaryController {
  constructor(private readonly summary: SummaryService) {}

  @Post()
  @HttpCode(200)
  generate(
    @Param("lessonId") lessonId: string,
    @CurrentTutor() tutor: TutorSessionClaims,
  ) {
    return this.summary.generate(lessonId, tutor.sub);
  }
}
