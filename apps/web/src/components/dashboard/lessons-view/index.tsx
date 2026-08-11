import Link from "next/link";
import type { Lesson } from "@educatio/shared";
import CascadeUp from "@/components/motion/cascade-up";
import { cn } from "@/lib/utils";
import { FILTERS, LESSON_GRID, type LessonFilter } from "./helpers/constants";
import LessonRow from "./components/lesson-row";
import LessonCard from "./components/lesson-card";
import LessonsPagination from "./components/lessons-pagination";
import LessonsSearch from "./components/lessons-search";
import { dashboardHref } from "@/lib/routes";

interface Props {
  lessons: Lesson[];
  total: number;
  page: number;
  totalPages: number;
  status: LessonFilter;
  q: string;
  timeZone?: string;
}

const LessonsView = ({
  lessons,
  total,
  page,
  totalPages,
  status,
  q,
  timeZone,
}: Props) => (
  <div className="px-6 py-5 md:px-10 md:pb-10">
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <LessonsSearch initialQuery={q} status={status} />
      {FILTERS.map((filter) => {
        const active = filter.value === status;
        return (
          <Link
            key={filter.value}
            href={dashboardHref({ status: filter.value, q })}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex h-7.5 items-center rounded-full border px-3 text-[12.5px] font-medium no-underline transition-colors",
              "focus-visible:ring-accent-brand/60 outline-none focus-visible:ring-2",
              active
                ? "border-accent-soft-border bg-accent-soft text-accent-brand"
                : "border-border-subtle text-text-secondary hover:text-text-primary",
            )}
          >
            {filter.label}
          </Link>
        );
      })}
      <div className="flex-1" />
      <span className="text-text-tertiary text-[12.5px]">
        {total} {total === 1 ? "lesson" : "lessons"}
      </span>
    </div>

    {lessons.length === 0 ? (
      <div className="border-border-subtle bg-surface text-text-secondary rounded-xl border px-6 py-16 text-center text-sm">
        {q
          ? `No lessons match “${q}”.`
          : status === "all"
            ? "No lessons to show."
            : `No ${status} lessons to show.`}
      </div>
    ) : (
      <>
        <div className="flex flex-col gap-3 md:hidden">
          {lessons.map((lesson, index) => (
            <CascadeUp
              key={lesson.id}
              delay={Math.min(120 + index * 50, 600)}
              y={8}
              duration={500}
            >
              <LessonCard lesson={lesson} timeZone={timeZone} />
            </CascadeUp>
          ))}
        </div>

        <div className="border-border-subtle bg-surface hidden overflow-x-auto rounded-xl border md:block">
          <div className="min-w-180">
            <div
              className={cn(
                LESSON_GRID,
                "bg-bg border-border-subtle text-text-tertiary border-b px-5 py-3 text-[11.5px] font-semibold tracking-[0.08em] uppercase",
              )}
            >
              <span>Lesson</span>
              <span>Student</span>
              <span>When</span>
              <span className="text-right">Duration</span>
              <span>Status</span>
              <span />
            </div>
            {lessons.map((lesson, index) => (
              <CascadeUp
                key={lesson.id}
                delay={Math.min(120 + index * 50, 600)}
                y={8}
                duration={500}
              >
                <LessonRow
                  lesson={lesson}
                  last={index === lessons.length - 1}
                  timeZone={timeZone}
                />
              </CascadeUp>
            ))}
          </div>
        </div>
      </>
    )}

    {totalPages > 1 && (
      <LessonsPagination
        page={page}
        totalPages={totalPages}
        status={status}
        q={q}
      />
    )}
  </div>
);

export default LessonsView;
