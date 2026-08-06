import { z } from "zod";
import { lessonSummarySchema, lessonPath } from "./lessons";

export const SUMMARY_SEGMENT = "summary";
export const lessonSummaryPath = (lessonId: string) =>
  `${lessonPath(lessonId)}/${SUMMARY_SEGMENT}`;

export const summaryResponseSchema = z.object({
  summary: lessonSummarySchema,
});
export type SummaryResponse = z.infer<typeof summaryResponseSchema>;
