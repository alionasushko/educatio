import "server-only";
import { okResponseSchema, type OkResponse } from "@educatio/shared/api/common";
import {
  LESSONS_PATH,
  lessonPath,
  createLessonResponseSchema,
  lessonListResponseSchema,
  lessonSchema,
  type CreateLessonInput,
  type CreateLessonResponse,
  type LessonListResponse,
  type LessonResponse,
  type ListLessonsQuery,
  type UpdateLessonInput,
} from "@educatio/shared/api/lessons";
import { api } from "./api-client";

export const listLessons = (query: ListLessonsQuery) =>
  api.get<LessonListResponse>(LESSONS_PATH, {
    schema: lessonListResponseSchema,
    query: {
      page: query.page,
      limit: query.limit,
      status: query.status,
      q: query.q,
    },
  });

export const getLesson = (id: string) =>
  api.get<LessonResponse>(lessonPath(id), { schema: lessonSchema });

export const createLesson = (input: CreateLessonInput) =>
  api.post<CreateLessonResponse>(LESSONS_PATH, {
    schema: createLessonResponseSchema,
    body: input,
  });

export const updateLesson = (id: string, input: UpdateLessonInput) =>
  api.patch<LessonResponse>(lessonPath(id), {
    schema: lessonSchema,
    body: input,
  });

export const deleteLesson = (id: string) =>
  api.del<OkResponse>(lessonPath(id), { schema: okResponseSchema });
