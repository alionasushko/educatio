"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useBroadcastEvent } from "@liveblocks/react";
import { useCanvasFlush } from "@/components/canvas/canvas-snapshot/helpers/use-canvas-flush";
import { markLessonClosed } from "@/components/canvas/canvas-snapshot/helpers/closed-lessons";
import { SquareIcon } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Button from "@/components/ui/button";
import { endLessonAction } from "@/app/lesson/[lessonId]/actions";
import { lessonSummaryHref } from "@/lib/routes";

interface Props {
  lessonId: string;
}

const EndLessonButton = ({ lessonId }: Props) => {
  const router = useRouter();
  const broadcast = useBroadcastEvent();
  const flushCanvas = useCanvasFlush(lessonId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(undefined);
    startTransition(async () => {
      const flushed = await flushCanvas();
      if (!flushed.ok) {
        setError(flushed.error);
        return;
      }

      const result = await endLessonAction(lessonId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      markLessonClosed(lessonId);
      broadcast({ type: "lesson-ended" });
      router.push(lessonSummaryHref(lessonId));
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
        className="h-9 gap-1.5 px-3 text-sm"
      >
        <SquareIcon className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">End lesson</span>
      </Button>

      {open && (
        <ConfirmDialog
          title="End this lesson?"
          description="The canvas closes for editing and everyone is moved to the summary. We'll write it up from what's on the canvas — this can take a few moments."
          confirmLabel="End lesson"
          pendingLabel="Ending…"
          pending={isPending}
          error={error}
          onConfirm={handleConfirm}
          onClose={() => {
            if (!isPending) setOpen(false);
          }}
        />
      )}
    </>
  );
};

export default EndLessonButton;
