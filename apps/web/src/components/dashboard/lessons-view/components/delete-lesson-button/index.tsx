"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { deleteLessonAction } from "@/app/dashboard/actions";

interface Props {
  lessonId: string;
  lessonTitle: string;
}

const DeleteLessonButton = ({ lessonId, lessonTitle }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteLessonAction(lessonId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      toast.success(`"${lessonTitle}" deleted`);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
        aria-label={`Delete lesson: ${lessonTitle}`}
        title="Delete lesson"
        className="text-text-tertiary hover:text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/40 flex size-8 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2"
      >
        <Trash2Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
      </button>

      {open && (
        <ConfirmDialog
          title="Delete this lesson?"
          description={`“${lessonTitle}” and its canvas will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete lesson"
          pendingLabel="Deleting…"
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

export default DeleteLessonButton;
