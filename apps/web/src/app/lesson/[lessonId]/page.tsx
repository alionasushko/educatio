import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VideoIcon } from "lucide-react";
import Wordmark from "@/components/brand/wordmark";
import Badge from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { statusMeta } from "@/components/dashboard/lessons-view/helpers/helpers";
import CanvasRoom from "@/components/canvas/canvas-room";
import ConnectionStatus from "@/components/canvas/connection-status";
import PresenceStack from "@/components/canvas/presence-stack";
import LessonCanvas from "@/components/canvas/lesson-canvas";
import ShareLessonButton from "@/components/lesson/share-lesson-button";
import { cn } from "@/lib/utils";
import { getLesson } from "@/lib/api-lessons";
import { getLatestSnapshot } from "@/lib/api-snapshots";
import { fetchCurrentUser } from "@/lib/api-auth";
import { query, queryOrNotFound } from "@/lib/api-error";
import { getCurrentSession } from "@/lib/session-server";
import { signInRoute } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Lesson",
};

interface Props {
  params: Promise<{ lessonId: string }>;
}

const LessonPage = async ({ params }: Props) => {
  const { lessonId } = await params;

  const session = await getCurrentSession();
  if (!session) {
    redirect(signInRoute(`/lesson/${lessonId}`));
  }

  // Someone else's lesson looks the same as a missing one, by design.
  const [lesson, snapshot, me] = await Promise.all([
    queryOrNotFound(() => getLesson(lessonId)),
    query(() => getLatestSnapshot(lessonId)),
    session.kind === "tutor" ? query(() => fetchCurrentUser()) : null,
  ]);

  const { variant, label } = statusMeta(lesson.status);

  const displayName =
    session.kind === "student"
      ? session.name
      : (me?.data?.user.name ?? session.email);

  const videoHref =
    lesson.videoCallUrl && /^https?:\/\//i.test(lesson.videoCallUrl)
      ? lesson.videoCallUrl
      : undefined;

  const live = lesson.status !== "ended";
  const isTutor = session.kind === "tutor";

  const shell = (
    <div className="bg-bg flex h-dvh flex-col overflow-hidden">
      <header className="border-border-subtle bg-surface flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Wordmark href={isTutor ? "/dashboard" : undefined} size={14} />
          <span
            className="bg-border-subtle h-5 w-px shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h1 className="text-text-primary truncate text-sm font-medium">
              {lesson.title}
            </h1>
            {lesson.studentName && (
              <p className="text-text-secondary truncate text-xs">
                with {lesson.studentName}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {live && <PresenceStack />}
          {live && <ConnectionStatus />}
          <Badge variant={variant} dot>
            {label}
          </Badge>
          {live && isTutor && (
            <ShareLessonButton inviteCode={lesson.inviteCode} />
          )}
          {videoHref && (
            <a
              href={videoHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-9 gap-1.5 px-3 text-sm",
              )}
            >
              <VideoIcon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Join video call</span>
            </a>
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
        </div>
      </header>

      <main className="min-h-0 flex-1">
        {live ? (
          <LessonCanvas lessonId={lesson.id} />
        ) : (
          <div className="flex h-full items-center justify-center px-6">
            <div className="max-w-100 text-center">
              <h2 className="text-text-primary text-lg font-semibold tracking-tight">
                This lesson has ended
              </h2>
              <p className="text-text-secondary mt-2 text-sm leading-relaxed">
                The canvas is closed for editing. A summary of what you covered
                is on its way.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  if (!live) return shell;

  return (
    <CanvasRoom
      roomId={lesson.liveblocksRoomId}
      name={displayName}
      role={session.kind}
      snapshot={snapshot.data?.snapshot ?? null}
    >
      {shell}
    </CanvasRoom>
  );
};

export default LessonPage;
