"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useBroadcastEvent } from "@liveblocks/react";
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
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await endLessonAction(lessonId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
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
          description="The canvas closes for editing and everyone is moved to the summary. We'll write it up from what's on the board — this can take a few moments."
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
