import type { Lesson, LessonStatus } from "@educatio/shared";
import type { BadgeVariant } from "@/components/ui/badge";

interface WhenFormatters {
  time: Intl.DateTimeFormat;
  monthDay: Intl.DateTimeFormat;
  monthDayYear: Intl.DateTimeFormat;
  dayKey: Intl.DateTimeFormat;
}

const formatterCache = new Map<string, WhenFormatters>();

const formattersFor = (timeZone?: string): WhenFormatters => {
  const cached = formatterCache.get(timeZone ?? "");
  if (cached) return cached;

  const built: WhenFormatters = {
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }),
    monthDay: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone,
    }),
    monthDayYear: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone,
    }),
    dayKey: new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone,
    }),
  };

  formatterCache.set(timeZone ?? "", built);
  return built;
};

const shiftDay = (key: string, days: number): string => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
};

type WhenFields = Pick<Lesson, "status" | "startedAt" | "createdAt">;

export const formatWhen = (lesson: WhenFields, timeZone?: string): string => {
  const fmt = formattersFor(timeZone);

  if (lesson.status === "active") {
    const started = lesson.startedAt ? new Date(lesson.startedAt) : null;
    return started && !Number.isNaN(started.getTime())
      ? `In progress · started ${fmt.time.format(started)}`
      : "In progress";
  }

  const date = new Date(lesson.startedAt ?? lesson.createdAt);
  if (Number.isNaN(date.getTime())) return "—";

  const today = fmt.dayKey.format(new Date());
  const key = fmt.dayKey.format(date);

  let datePart: string;
  if (key === today) datePart = "Today";
  else if (key === shiftDay(today, -1)) datePart = "Yesterday";
  else if (key.slice(0, 4) === today.slice(0, 4))
    datePart = fmt.monthDay.format(date);
  else datePart = fmt.monthDayYear.format(date);

  return `${datePart} · ${fmt.time.format(date)}`;
};

export const formatDuration = (
  lesson: Pick<Lesson, "status" | "durationSeconds">,
): string => {
  if (lesson.status !== "ended" || !lesson.durationSeconds) return "—";
  const minutes = Math.max(1, Math.round(lesson.durationSeconds / 60));
  return `${minutes} min`;
};

export const statusMeta = (
  status: LessonStatus,
): { variant: BadgeVariant; label: string } => {
  switch (status) {
    case "active":
      return { variant: "active", label: "Live" };
    case "ended":
      return { variant: "ended", label: "Ended" };
    default:
      return { variant: "draft", label: "Scheduled" };
  }
};
