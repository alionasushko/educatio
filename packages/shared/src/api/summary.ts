import { z } from "zod";
import { lessonSummarySchema, lessonPath } from "./lessons";

export const lessonSummaryPath = (lessonId: string) =>
  `${lessonPath(lessonId)}/summary`;

export const summaryResponseSchema = z.object({
  summary: lessonSummarySchema,
});
export type SummaryResponse = z.infer<typeof summaryResponseSchema>;
