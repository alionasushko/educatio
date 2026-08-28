"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Markdown from "react-markdown";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import Button from "@/components/ui/button";
import { generateSummaryAction } from "@/app/lesson/[lessonId]/actions";

interface Props {
  lessonId: string;
  text?: string;
  canGenerate: boolean;
}

const LessonSummary = ({ lessonId, text, canGenerate }: Props) => {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const requested = useRef(false);

  const generate = () => {
    setError(undefined);
    requested.current = true;
    startTransition(async () => {
      const result = await generateSummaryAction(lessonId);
      if (!result.ok) setError(result.error);
    });
  };

  useEffect(() => {
    if (text || !canGenerate || requested.current) return;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, canGenerate]);

  if (text) {
    return (
      <div className="prose-summary text-text-primary text-[14.5px] leading-relaxed">
        <Markdown>{text}</Markdown>
      </div>
    );
  }

  return (
    <div className="border-border-subtle rounded-md border border-dashed p-8 text-center">
      <h2 className="text-text-primary text-[15px] font-semibold">
        {!canGenerate
          ? "Your tutor is writing the summary"
          : isPending
            ? "Writing your summary…"
            : "No summary yet"}
      </h2>
      <p className="text-text-secondary mx-auto mt-1.5 max-w-90 text-[13.5px] leading-relaxed">
        {!canGenerate
          ? "It'll appear here once it's ready. Check back shortly."
          : isPending
            ? "Reading through the canvas and writing it up — this takes a few moments."
            : "We couldn't write this one up automatically. Give it another go — it reads whatever was left on the canvas."}
      </p>

      {error && (
        <p
          role="alert"
          className="text-destructive mt-3 text-[13px] leading-snug"
        >
          {error}
        </p>
      )}

      {canGenerate && (
        <Button
          type="button"
          onClick={generate}
          disabled={isPending}
          className="mt-5 h-10 gap-1.5 px-4 text-sm"
        >
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <SparklesIcon className="size-4" aria-hidden="true" />
          )}
          {isPending ? "Writing…" : "Generate summary"}
        </Button>
      )}
    </div>
  );
};

export default LessonSummary;
