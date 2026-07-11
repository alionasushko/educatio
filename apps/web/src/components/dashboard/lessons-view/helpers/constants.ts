import type { ListLessonsQuery } from "@educatio/shared/api/lessons";

export type LessonFilter = ListLessonsQuery["status"];

export const LESSON_GRID =
  "grid grid-cols-[minmax(0,2.4fr)_1fr_1fr_88px_110px_44px] items-center gap-4";

export const FILTERS: { value: LessonFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "ended", label: "Ended" },
];
