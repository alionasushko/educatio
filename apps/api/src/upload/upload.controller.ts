import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import "@fastify/multipart";
import { UploadService } from "./upload.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";

@Controller("upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post()
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
