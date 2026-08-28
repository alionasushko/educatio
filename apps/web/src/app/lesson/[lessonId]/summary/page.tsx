import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Wordmark from "@/components/brand/wordmark";
import { buttonVariants } from "@/components/ui/button";
import LessonSummary from "@/components/lesson/lesson-summary";
import EmailSummaryButton from "@/components/lesson/email-summary-button";
import { cn } from "@/lib/utils";
import { getLesson } from "@/lib/api-lessons";
import { queryOrNotFound } from "@/lib/api-error";
import { getCurrentSession } from "@/lib/session-server";
import { signInRoute } from "@/lib/routes";
import { TIMEZONE_COOKIE, safeTimeZone } from "@/lib/timezone";

export const metadata: Metadata = {
  title: "Lesson summary",
};

interface Props {
  params: Promise<{ lessonId: string }>;
}

const minutes = (seconds?: number): string | null => {
  if (!seconds || seconds < 60) return null;
  const total = Math.round(seconds / 60);
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

const LessonSummaryPage = async ({ params }: Props) => {
  const { lessonId } = await params;

  const session = await getCurrentSession();
  if (!session) redirect(signInRoute(`/lesson/${lessonId}/summary`));

  const lesson = await queryOrNotFound(() => getLesson(lessonId));
  if (lesson.status !== "ended") redirect(`/lesson/${lessonId}`);

  const isTutor = session.kind === "tutor";
  const timeZone = safeTimeZone((await cookies()).get(TIMEZONE_COOKIE)?.value);
  const ended = lesson.endedAt
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "long",
        timeZone,
      }).format(new Date(lesson.endedAt))
    : null;
  const length = minutes(lesson.durationSeconds);
  const counterpart = isTutor ? lesson.studentName : lesson.tutorName;

  return (
    <div className="bg-bg min-h-dvh">
      <header className="border-border-subtle bg-surface flex h-14 items-center gap-2 border-b px-4 md:px-6">
        <Wordmark href={isTutor ? "/dashboard" : undefined} size={14} />
        <span className="flex-1" />
        {isTutor && lesson.summary?.text && (
          <EmailSummaryButton
            lessonTitle={lesson.title}
            studentEmail={lesson.studentEmail}
            summary={lesson.summary.text}
          />
        )}
        {isTutor && (
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 px-3 text-sm",
            )}
          >
            Back
          </Link>
        )}
      </header>

      <main className="mx-auto max-w-180 px-6 py-10">
        <h1 className="text-text-primary text-[24px] font-semibold tracking-[-0.02em]">
          {lesson.title}
        </h1>
        <p className="text-text-secondary mt-1.5 text-[13.5px]">
          {[counterpart && `with ${counterpart}`, ended, length]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-8">
          <LessonSummary
            lessonId={lesson.id}
            text={lesson.summary?.text}
            canGenerate={isTutor}
          />
        </div>
      </main>
    </div>
  );
};

export default LessonSummaryPage;
