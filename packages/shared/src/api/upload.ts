import { z } from "zod";

export const UPLOAD_PATH = "/upload";

export const uploadResponseSchema = z.object({ url: z.string().url() });
export type UploadResponse = z.infer<typeof uploadResponseSchema>;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
