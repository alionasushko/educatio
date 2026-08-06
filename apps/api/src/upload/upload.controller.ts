import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import "@fastify/multipart";
import { Throttle } from "@nestjs/throttler";
import { UploadService } from "./upload.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { UPLOAD_SEGMENT } from "@educatio/shared/api/upload";

@Controller(UPLOAD_SEGMENT)
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async handle(@Req() req: FastifyRequest) {
    const file = await req.file();
    if (!file) {
      throw new BadRequestException({
        code: "no_file",
        message: "No file was provided.",
      });
    }
    return this.upload.put(file);
  }
}
