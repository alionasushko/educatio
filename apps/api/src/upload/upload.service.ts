import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { put } from "@vercel/blob";
import type { MultipartFile } from "@fastify/multipart";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  type UploadResponse,
} from "@educatio/shared/api/upload";
import type { Env } from "../config/env";

@Injectable()
export class UploadService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async put(file: MultipartFile): Promise<UploadResponse> {
    if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException({
        code: "unsupported_type",
        message: "Only PNG, JPG, WEBP, and GIF images are allowed.",
      });
    }

    const buffer = await file.toBuffer();
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException({
        code: "file_too_large",
        message: "Images must be 5MB or smaller.",
      });
    }

    const token = this.config.get("BLOB_READ_WRITE_TOKEN", { infer: true });
    if (!token) {
      throw new ServiceUnavailableException("Uploads are not configured");
    }

    const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const { url } = await put(`uploads/${Date.now()}-${safeName}`, buffer, {
      access: "public",
      token,
      contentType: file.mimetype,
    });
    return { url };
  }
}
