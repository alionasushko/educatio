"use client";

import { Loader2Icon } from "lucide-react";
import Dialog from "@/components/ui/dialog";
import Button from "@/components/ui/button";

interface Props {
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  pending?: boolean;
  error?: string;
}

const ConfirmDialog = ({
  title,
  description,
  confirmLabel,
  pendingLabel,
  onConfirm,
  onClose,
  pending = false,
  error,
}: Props) => (
  <Dialog onClose={onClose} label={title} className="max-w-100">
    <h2 className="text-text-primary text-[18px] font-semibold tracking-[-0.015em]">
      {title}
    </h2>
    <p className="text-text-secondary mt-2 text-[13.5px] leading-normal">
      {description}
    </p>

    {error && (
      <p
        role="alert"
        className="text-destructive mt-3 text-[13px] leading-snug"
      >
        {error}
      </p>
    )}

    <div className="mt-5 flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={onClose}
        disabled={pending}
        autoFocus
        className="h-10 px-4 text-sm"
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="destructive"
        onClick={onConfirm}
        disabled={pending}
        className="h-10 gap-1.5 px-4 text-sm"
      >
        {pending && (
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        )}
        {pending ? pendingLabel : confirmLabel}
      </Button>
    </div>
  </Dialog>
);

export default ConfirmDialog;
