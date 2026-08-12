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

  const shell = (
    <div className="bg-bg flex min-h-dvh flex-col">
      <header className="border-border-subtle bg-surface flex items-center justify-between border-b px-6 py-4 md:px-10">
        <Wordmark href="/dashboard" size={14} />
        <div className="flex items-center gap-3">
          {live && <ConnectionStatus />}
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 px-3.5 text-sm",
            )}
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-115 text-center">
          <div className="mb-4 flex justify-center">
            <Badge variant={variant} dot>
              {label}
            </Badge>
          </div>
          <h1 className="text-text-primary text-2xl font-semibold tracking-tight">
            {lesson.title}
          </h1>
          {lesson.studentName && (
            <p className="text-text-secondary mt-1.5 text-sm">
              with {lesson.studentName}
            </p>
          )}
          <p className="text-text-secondary mx-auto mt-4 text-sm leading-relaxed">
            The live whiteboard for this lesson is coming soon. Your lesson is
            created and saved to your dashboard.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {videoHref && (
              <a
                href={videoHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 gap-1.5 px-4 text-sm",
                )}
              >
                <VideoIcon className="size-4" aria-hidden="true" />
                Join video call
              </a>
            )}
            <Link
              href="/dashboard"
              className={cn(buttonVariants(), "h-10 px-4 text-sm")}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
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
