import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Wordmark from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";
import LessonSummary from "@/components/lesson/lesson-summary";
import EmailSummaryButton from "@/components/lesson/email-summary-button";
import SummaryExports from "@/components/lesson/summary-exports";
import CanvasThumbnail from "@/components/lesson/canvas-thumbnail";
import CanvasViewer from "@/components/lesson/canvas-viewer";
import { getLesson } from "@/lib/api-lessons";
import { getLatestSnapshot } from "@/lib/api-snapshots";
import { snapshotElements } from "@/lib/canvas-elements";
import { query, queryOrNotFound } from "@/lib/api-error";
import { getCurrentSession } from "@/lib/session-server";
import { signInRoute } from "@/lib/routes";
import { TIMEZONE_COOKIE, safeTimeZone } from "@/lib/timezone";

export const metadata: Metadata = {
  title: "Lesson summary",
};

interface Props {
  params: Promise<{ lessonId: string }>;
}

const LessonSummaryPage = async ({ params }: Props) => {
  const { lessonId } = await params;

  const session = await getCurrentSession();
  if (!session) redirect(signInRoute(`/lesson/${lessonId}/summary`));

  const lesson = await queryOrNotFound(() => getLesson(lessonId));
  if (lesson.status !== "ended") redirect(`/lesson/${lessonId}`);

  const snapshot = await query(() => getLatestSnapshot(lessonId));
  const board = snapshotElements(snapshot.data?.snapshot ?? null);

  const isTutor = session.kind === "tutor";
  const timeZone = safeTimeZone((await cookies()).get(TIMEZONE_COOKIE)?.value);
  const ended = lesson.endedAt
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "long",
        timeZone,
      }).format(new Date(lesson.endedAt))
    : null;
  const counterpart = isTutor ? lesson.studentName : lesson.tutorName;
  const metaLine = [counterpart && `with ${counterpart}`, ended]
    .filter(Boolean)
    .join(" · ");

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
          <ButtonLink
            href="/dashboard"
            variant="ghost"
            className="h-9 px-3 text-sm"
          >
            Back
          </ButtonLink>
        )}
      </header>

      <main className="mx-auto max-w-180 px-6 py-10">
        <h1 className="text-text-primary text-[24px] font-semibold tracking-[-0.02em]">
          {lesson.title}
        </h1>
        <p className="text-text-secondary mt-1.5 text-[13.5px]">{metaLine}</p>

        {lesson.summary?.text && (
          <div className="mt-6">
            <SummaryExports
              lessonTitle={lesson.title}
              meta={metaLine}
              summary={lesson.summary.text}
            />
          </div>
        )}

        {board.length > 0 && (
          <div className="mt-8">
            <CanvasThumbnail elements={board} />
            <div className="mt-2 flex items-center justify-between gap-3">
              <figcaption className="text-text-tertiary text-[12.5px]">
                The whiteboard at the end of the lesson
              </figcaption>
              <CanvasViewer elements={board} />
            </div>
          </div>
        )}

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
