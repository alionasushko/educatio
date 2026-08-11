import type { LessonStatus } from "@educatio/shared";

export const signInRoute = (callbackUrl?: string): string =>
  callbackUrl
    ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/sign-in";

export const lessonHref = (lesson: {
  id: string;
  status: LessonStatus;
}): string =>
  lesson.status === "ended"
    ? `/lesson/${lesson.id}/summary`
    : `/lesson/${lesson.id}`;

export interface DashboardQuery {
  status?: string;
  q?: string;
  page?: number;
}

export const dashboardHref = ({ status, q, page }: DashboardQuery): string => {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
};
