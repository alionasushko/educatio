import type { Metadata } from "next";
import Link from "next/link";
import { XIcon } from "lucide-react";
import NewLessonForm from "@/components/lesson/new-lesson-form";
import { requireTutor } from "@/lib/session-server";

export const metadata: Metadata = {
  title: "New lesson",
};

const NewLessonPage = async () => {
  await requireTutor("/lesson/new");

  return (
    <div className="bg-bg flex min-h-dvh items-center justify-center p-6">
      <div className="border-border-subtle bg-surface w-full max-w-115 rounded-[14px] border p-7 shadow-(--shadow-large) motion-safe:animate-[edu-modal-in_320ms_cubic-bezier(0.22,1,0.36,1)]">
        <div className="mb-1.5 flex items-center justify-between">
          <h1 className="text-text-primary text-[19px] font-semibold tracking-[-0.015em]">
            New lesson
          </h1>
          <Link
            href="/dashboard"
            aria-label="Cancel"
            className="text-text-tertiary hover:text-text-secondary focus-visible:ring-accent-brand/60 flex size-9 items-center justify-center rounded-md no-underline transition-colors outline-none focus-visible:ring-2"
          >
            <XIcon className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
        <p className="text-text-secondary mb-5.5 text-[13.5px] leading-normal">
          Set a title now — the rest can wait until your student joins.
        </p>
        <NewLessonForm />
      </div>
    </div>
  );
};

export default NewLessonPage;
