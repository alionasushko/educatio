import { z } from "zod";
import type { Lesson } from "../lesson";

const videoCallUrlSchema = z.url({ protocol: /^https?$/ });

export const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  studentName: z.string().max(120).optional(),
  videoCallUrl: videoCallUrlSchema.optional(),
});
export type CreateLessonInput = z.infer<typeof createLessonSchema>;

export const updateLessonSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    studentName: z.string().max(120).optional(),
    videoCallUrl: videoCallUrlSchema.optional(),
    status: z.enum(["scheduled", "active", "ended"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
  });
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;

export const listLessonsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["all", "active", "ended"]).default("all"),
  q: z.string().trim().max(120).optional(),
});
export type ListLessonsQuery = z.infer<typeof listLessonsQuerySchema>;

export interface CreateLessonResponse {
  id: string;
  inviteCode: string;
  liveblocksRoomId: string;
}

export interface LessonListResponse {
  lessons: Lesson[];
  total: number;
  page: number;
  totalPages: number;
}
