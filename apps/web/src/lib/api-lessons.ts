import "server-only";
import type { Lesson } from "@educatio/shared";
import type { OkResponse } from "@educatio/shared/api/common";
import type {
  CreateLessonInput,
  CreateLessonResponse,
  LessonListResponse,
  ListLessonsQuery,
} from "@educatio/shared/api/lessons";
import { api, url } from "./api-client";

export const listLessons = (query: ListLessonsQuery) =>
  api.get<LessonListResponse>("/lessons", {
    query: {
      page: query.page,
      limit: query.limit,
      status: query.status,
      q: query.q,
    },
  });

export const getLesson = (id: string) => api.get<Lesson>(url`/lessons/${id}`);

export const createLesson = (input: CreateLessonInput) =>
  api.post<CreateLessonResponse>("/lessons", { body: input });

export const deleteLesson = (id: string) =>
  api.del<OkResponse>(url`/lessons/${id}`);
