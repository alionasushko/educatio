import type { Lesson } from "@educatio/shared";
import CascadeUp from "@/components/motion/cascade-up";
import { cn } from "@/lib/utils";
import { LESSON_GRID, type LessonFilter } from "./helpers/constants";
import LessonRow from "./components/lesson-row";
import LessonCard from "./components/lesson-card";
import LessonsFilters from "./components/lessons-filters";

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
  <LessonsFilters
    status={status}
    q={q}
    total={total}
    page={page}
    totalPages={totalPages}
  >
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
              <span>Created</span>
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
  </LessonsFilters>
);

export default LessonsView;
