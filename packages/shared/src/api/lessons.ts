import { z } from "zod";

export const LESSONS_SEGMENT = "lessons";
export const LESSONS_PATH = `/${LESSONS_SEGMENT}`;

export const lessonPath = (id: string) =>
  `${LESSONS_PATH}/${encodeURIComponent(id)}`;

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

export const lessonSummarySchema = z.object({
  text: z.string(),
  generatedAt: z.iso.datetime(),
});
export type LessonSummaryResponse = z.infer<typeof lessonSummarySchema>;

export const lessonSchema = z.object({
  id: z.string(),
  tutorId: z.string(),
  title: z.string(),
  studentName: z.string().optional(),
  videoCallUrl: z.string().optional(),
  inviteCode: z.string(),
  status: z.enum(["scheduled", "active", "ended"]),
  startedAt: z.iso.datetime().optional(),
  endedAt: z.iso.datetime().optional(),
  durationSeconds: z.number().optional(),
  liveblocksRoomId: z.string(),
  summary: lessonSummarySchema.optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type LessonResponse = z.infer<typeof lessonSchema>;

export const createLessonResponseSchema = z.object({
  id: z.string(),
  inviteCode: z.string(),
  liveblocksRoomId: z.string(),
});
export type CreateLessonResponse = z.infer<typeof createLessonResponseSchema>;

export const lessonListResponseSchema = z.object({
  lessons: z.array(lessonSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
});
export type LessonListResponse = z.infer<typeof lessonListResponseSchema>;
