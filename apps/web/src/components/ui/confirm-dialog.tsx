"use client";

import Dialog from "@/components/ui/dialog";
import Button from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import FormError from "@/components/ui/form-error";

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

    {error && <FormError className="mt-3">{error}</FormError>}

    <div className="mt-5 flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={onClose}
        disabled={pending}
        autoFocus
        size="form"
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="destructive"
        onClick={onConfirm}
        disabled={pending}
        size="form"
      >
        {pending && <Spinner />}
        {pending ? pendingLabel : confirmLabel}
      </Button>
    </div>
  </Dialog>
);

export default ConfirmDialog;
