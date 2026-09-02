import {
  BadRequestException,
  Controller,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import "@fastify/multipart";
import { Throttle } from "@nestjs/throttler";
import { UploadService } from "./upload.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { ObjectIdPipe } from "../common/object-id.pipe";
import { Session } from "../common/session.decorator";
import type { SessionClaims } from "@educatio/shared";
import { UPLOAD_SEGMENT } from "@educatio/shared/api/upload";

@Controller(UPLOAD_SEGMENT)
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async handle(
    @Req() req: FastifyRequest,
    @Query("lessonId", ObjectIdPipe) lessonId: string,
    @Session() session: SessionClaims,
  ) {
    const owned = await this.upload.assertCanUpload(lessonId, session);

    const file = await req.file();
    if (!file) {
      throw new BadRequestException({
        code: "no_file",
        message: "No file was provided.",
      });
    }
    return this.upload.put(file, owned);
  }
}
