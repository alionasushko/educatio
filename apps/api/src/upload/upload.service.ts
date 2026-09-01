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
  type UploadResponse,
} from "@educatio/shared/api/upload";
import { detectImageType } from "./image-type";

const UPLOADS_PER_LESSON = 30;
import type { Env } from "../config/env";
import { Upload, UploadDocument } from "../schemas/upload.schema";

@Injectable()
export class UploadService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    @InjectModel(Upload.name) private readonly uploads: Model<UploadDocument>,
  ) {}

  async put(file: MultipartFile, lessonId: string): Promise<UploadResponse> {
    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch (err) {
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        throw new PayloadTooLargeException({
          code: "file_too_large",
          message: "Images must be 5MB or smaller.",
        });
      }
      throw err;
    }
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException({
        code: "file_too_large",
        message: "Images must be 5MB or smaller.",
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
        message: "Only PNG, JPG, WEBP, and GIF images are allowed.",
      });
    }

    const token = this.config.get("BLOB_READ_WRITE_TOKEN", { infer: true });
    if (!token) {
      throw new ServiceUnavailableException({
        code: "service_unavailable",
        message: "Uploads are not configured",
      });
    }

    const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const { url } = await put(`uploads/${randomUUID()}-${safeName}`, buffer, {
      access: "public",
      token,
      contentType,
    });
    await this.uploads.create({ lessonId, url });
    return { url };
  }
}
