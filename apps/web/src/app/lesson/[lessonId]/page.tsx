import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoIcon } from "lucide-react";
import type { Lesson } from "@educatio/shared";
import Wordmark from "@/components/brand/wordmark";
import Badge from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { statusMeta } from "@/components/dashboard/lessons-view/helpers/helpers";
import { cn } from "@/lib/utils";
import { ApiClientError } from "@/lib/api-client";
import { getLesson } from "@/lib/api-lessons";

export const metadata: Metadata = {
  title: "Lesson",
};

interface Props {
  params: Promise<{ lessonId: string }>;
}

const LessonPage = async ({ params }: Props) => {
  const { lessonId } = await params;

  let lesson: Lesson;
  try {
    lesson = await getLesson(lessonId);
  } catch (err) {
    if (
      err instanceof ApiClientError &&
      (err.body.code === "not_found" || err.body.code === "forbidden")
    ) {
      notFound();
    }
    throw err;
  }

  const { variant, label } = statusMeta(lesson.status);
  // Only surface an http(s) call link — never a javascript:/data: URL.
  const videoHref =
    lesson.videoCallUrl && /^https?:\/\//i.test(lesson.videoCallUrl)
      ? lesson.videoCallUrl
      : undefined;

  return (
    <div className="bg-bg flex min-h-dvh flex-col">
      <header className="border-border-subtle bg-surface flex items-center justify-between border-b px-6 py-4 md:px-10">
        <Wordmark href="/dashboard" size={14} />
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 px-3.5 text-sm",
          )}
        >
          Back to dashboard
        </Link>
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
};

export default LessonPage;
