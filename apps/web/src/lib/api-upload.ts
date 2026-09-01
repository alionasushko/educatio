import "server-only";
import {
  UPLOAD_PATH,
  uploadResponseSchema,
  type UploadResponse,
} from "@educatio/shared/api/upload";
import { api } from "./api-client";

export const uploadImage = (body: FormData, lessonId: string) =>
  api.post<UploadResponse>(UPLOAD_PATH, {
    schema: uploadResponseSchema,
    body,
    query: { lessonId },
  });
