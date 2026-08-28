import "server-only";
import {
  lessonSummaryPath,
  summaryResponseSchema,
  type SummaryResponse,
} from "@educatio/shared/api/summary";
import { api } from "./api-client";

const SUMMARY_TIMEOUT_MS = 90_000;

export const generateSummary = (lessonId: string) =>
  api.post<SummaryResponse>(lessonSummaryPath(lessonId), {
    schema: summaryResponseSchema,
    timeoutMs: SUMMARY_TIMEOUT_MS,
  });
