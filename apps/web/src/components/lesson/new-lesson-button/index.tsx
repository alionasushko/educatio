"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import Button from "@/components/ui/button";
import Dialog from "@/components/ui/dialog";
import NewLessonForm from "@/components/lesson/new-lesson-form";

const NewLessonButton = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        size="form"
        className="shrink-0"
      >
        <PlusIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
        Start new lesson
      </Button>

      {open && (
        <Dialog onClose={close} label="New lesson">
          <div className="mb-1.5 flex items-center justify-between">
            <h2 className="text-text-primary text-[19px] font-semibold tracking-[-0.015em]">
              New lesson
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              title="Close"
              className="text-text-tertiary hover:text-text-secondary focus-visible:ring-accent-brand/60 flex size-9 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2"
            >
              <XIcon
                className="size-3.5"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </button>
          </div>
          <NewLessonForm onCancel={close} />
        </Dialog>
      )}
    </>
  );
};

export default NewLessonButton;
