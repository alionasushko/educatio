import Link from "next/link";
import type { Lesson } from "@educatio/shared";
import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LESSON_GRID } from "../../helpers/constants";
import { formatDuration, formatWhen, statusMeta } from "../../helpers/helpers";
import LessonTimer from "../lesson-timer";
import DeleteLessonButton from "../delete-lesson-button";
import { lessonHref } from "@/lib/routes";

interface Props {
  lesson: Lesson;
  last: boolean;
  timeZone?: string;
}

const LessonRow = ({ lesson, last, timeZone }: Props) => {
  const { variant, label } = statusMeta(lesson.status);

  const href = lessonHref(lesson);

  return (
    <div
      className={cn(
        LESSON_GRID,
        "group hover:bg-accent-tint relative px-5 py-4 transition-colors",
        "has-[a:focus-visible]:ring-accent-brand/60 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset",
        !last && "border-border-subtle border-b",
      )}
    >
      <div className="min-w-0">
        <Link
          href={href}
          className="text-text-primary block truncate text-sm font-medium tracking-[-0.005em] no-underline outline-none after:absolute after:inset-0"
        >
          {lesson.title}
        </Link>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <Avatar name={lesson.studentName} size={22} />
        <span
          className={cn(
            "truncate text-[13.5px]",
            lesson.studentName ? "text-text-secondary" : "text-text-tertiary",
          )}
        >
          {lesson.studentName ?? "Awaiting student"}
        </span>
      </div>

      <div className="text-text-secondary text-[13.5px]">
        {formatWhen(lesson, timeZone)}
      </div>

      <div className="text-text-secondary text-right font-features-['tnum'] text-[13.5px]">
        {lesson.status === "active" && lesson.startedAt ? (
          <LessonTimer startedAt={lesson.startedAt} />
        ) : (
          formatDuration(lesson)
        )}
      </div>

      <div>
        <Badge variant={variant} dot>
          {label}
        </Badge>
      </div>

      <div className="relative z-10 flex justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <DeleteLessonButton lessonId={lesson.id} lessonTitle={lesson.title} />
      </div>
    </div>
  );
};

export default LessonRow;
