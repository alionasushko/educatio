import Link from "next/link";
import type { Lesson } from "@educatio/shared";
import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDuration, formatWhen, statusMeta } from "../../helpers/helpers";
import LessonTimer from "../lesson-timer";
import DeleteLessonButton from "../delete-lesson-button";

interface Props {
  lesson: Lesson;
  timeZone?: string;
}

const LessonCard = ({ lesson, timeZone }: Props) => {
  const { variant, label } = statusMeta(lesson.status);
  const href =
    lesson.status === "ended"
      ? `/lesson/${lesson.id}/summary`
      : `/lesson/${lesson.id}`;
  const duration = formatDuration(lesson);

  return (
    <div className="group border-border-subtle bg-surface hover:bg-accent-tint has-[a:focus-visible]:ring-accent-brand/60 relative flex flex-col gap-2.5 rounded-xl border p-4 transition-colors has-[a:focus-visible]:ring-2">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={href}
          className="text-text-primary min-w-0 text-sm font-medium tracking-[-0.005em] no-underline outline-none after:absolute after:inset-0"
        >
          {lesson.title}
        </Link>
        <div className="relative z-10 flex shrink-0 items-center gap-1.5">
          <Badge variant={variant} dot>
            {label}
          </Badge>
          <DeleteLessonButton lessonId={lesson.id} lessonTitle={lesson.title} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Avatar name={lesson.studentName} size={20} />
        <span
          className={cn(
            "truncate text-[13px]",
            lesson.studentName ? "text-text-secondary" : "text-text-tertiary",
          )}
        >
          {lesson.studentName ?? "Awaiting student"}
        </span>
      </div>

      <div className="text-text-tertiary flex items-center gap-2 text-[12.5px]">
        <span>{formatWhen(lesson, timeZone)}</span>
        {lesson.status === "active" && lesson.startedAt ? (
          <>
            <span aria-hidden="true">·</span>
            <LessonTimer startedAt={lesson.startedAt} />
          </>
        ) : (
          duration !== "—" && (
            <>
              <span aria-hidden="true">·</span>
              <span>{duration}</span>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default LessonCard;
