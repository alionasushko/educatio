import { z } from "zod";

export const UPLOAD_SEGMENT = "upload";
export const UPLOAD_PATH = `/${UPLOAD_SEGMENT}`;

export const uploadResponseSchema = z.object({ url: z.url() });
export type UploadResponse = z.infer<typeof uploadResponseSchema>;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOAD_TOO_LARGE = `Images must be ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB or smaller.`;
export const UPLOAD_UNSUPPORTED_TYPE =
  "Only PNG, JPG, WEBP, and GIF images are allowed.";
export const ALLOWED_UPLOAD_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
