import type { Lesson, LessonStatus } from "@educatio/shared";
import type { BadgeVariant } from "@/components/ui/badge";

interface DateFormatters {
  time: Intl.DateTimeFormat;
  monthDay: Intl.DateTimeFormat;
  monthDayYear: Intl.DateTimeFormat;
  dayKey: Intl.DateTimeFormat;
}

const formatterCache = new Map<string, DateFormatters>();

const formattersFor = (timeZone?: string): DateFormatters => {
  const cached = formatterCache.get(timeZone ?? "");
  if (cached) return cached;

  const built: DateFormatters = {
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

export const formatCreated = (
  lesson: Pick<Lesson, "createdAt">,
  timeZone?: string,
): string => {
  const fmt = formattersFor(timeZone);

  const date = new Date(lesson.createdAt);
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

const STATUS_META: Record<
  LessonStatus,
  { variant: BadgeVariant; label: string }
> = {
  active: { variant: "active", label: "Active" },
  ended: { variant: "ended", label: "Ended" },
};

export const statusMeta = (
  status: LessonStatus,
): { variant: BadgeVariant; label: string } => STATUS_META[status];
