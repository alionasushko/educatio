import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import type { MultipartFile } from "@fastify/multipart";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_TOO_LARGE,
  UPLOAD_UNSUPPORTED_TYPE,
  type UploadResponse,
} from "@educatio/shared/api/upload";
import { detectImageType } from "./image-type";
import { multipartException } from "./multipart-error";

import type { Env } from "../config/env";
import type { SessionClaims } from "@educatio/shared";
import { Upload, UploadDocument } from "../schemas/upload.schema";
import { LessonsService } from "../lessons/lessons.service";

const UPLOADS_PER_LESSON = 30;
const UNSAFE_FILENAME_CHARS = /[^a-zA-Z0-9._-]/g;
const MAX_FILENAME_LENGTH = 64;
const FALLBACK_FILENAME = "image";

@Injectable()
export class UploadService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    @InjectModel(Upload.name) private readonly uploads: Model<UploadDocument>,
    private readonly lessonsService: LessonsService,
  ) {}

  async assertCanUpload(
    lessonId: string,
    session: SessionClaims,
  ): Promise<string> {
    const lesson = await this.lessonsService.findOr404(lessonId);
    this.lessonsService.assertCanWrite(lesson, session);
    return lesson.id;
  }

  async put(file: MultipartFile, lessonId: string): Promise<UploadResponse> {
    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch (err) {
      throw multipartException(err) ?? err;
    }
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException({
        code: "file_too_large",
        message: UPLOAD_TOO_LARGE,
      });
    }

    const onThisLesson = await this.uploads.countDocuments({ lessonId });
    if (onThisLesson >= UPLOADS_PER_LESSON) {
      throw new ForbiddenException({
        code: "limit_reached",
        message: `A lesson can hold ${UPLOADS_PER_LESSON} images.`,
      });
    }

    const contentType = detectImageType(buffer);
    if (!contentType) {
      throw new BadRequestException({
        code: "unsupported_type",
        message: UPLOAD_UNSUPPORTED_TYPE,
      });
    }

    const token = this.config.get("BLOB_READ_WRITE_TOKEN", { infer: true });
    if (!token) {
      throw new ServiceUnavailableException({
        code: "service_unavailable",
        message: "Uploads are not configured",
      });
    }

    const provided: string | undefined = file.filename;
    const cleaned = (provided ?? "")
      .replace(UNSAFE_FILENAME_CHARS, "_")
      .slice(0, MAX_FILENAME_LENGTH);
    const safeName = cleaned || FALLBACK_FILENAME;
    const { url } = await put(`uploads/${randomUUID()}-${safeName}`, buffer, {
      access: "public",
      token,
      contentType,
    });
    await this.uploads.create({ lessonId, url });
    return { url };
  }
}
