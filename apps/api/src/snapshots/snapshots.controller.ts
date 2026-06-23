import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { SnapshotsService } from "./snapshots.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { Session } from "../common/session.decorator";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ObjectIdPipe } from "../common/object-id.pipe";
import {
  snapshotSchema,
  type SnapshotInput,
} from "@educatio/shared/api/snapshot";
import type { SessionClaims } from "@educatio/shared";

@Controller("lessons/:lessonId/snapshot")
@UseGuards(JwtAuthGuard)
export class SnapshotsController {
  constructor(private readonly snapshots: SnapshotsService) {}

  @Post()
  @HttpCode(200)
  save(
    @Param("lessonId", ObjectIdPipe) lessonId: string,
    @Session() session: SessionClaims,
    @Body(new ZodValidationPipe(snapshotSchema)) body: SnapshotInput,
  ) {
    return this.snapshots.save(lessonId, session, body.canvasState);
  }
}
