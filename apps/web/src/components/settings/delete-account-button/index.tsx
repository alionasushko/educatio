"use client";

import { useState, useTransition } from "react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import Button from "@/components/ui/button";
import { deleteAccountAction } from "@/app/settings/actions";

interface Props {
  email: string;
}

const DeleteAccountButton = ({ email }: Props) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.assign("/");
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
        className="h-10 px-4 text-sm"
      >
        Delete account
      </Button>

      {open && (
        <ConfirmDialog
          title="Delete your account?"
          description={`Everything under ${email} — every lesson, canvas and summary — will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete account"
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

export default DeleteAccountButton;
