"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resendAction } from "@/app/verify/actions";

interface Props {
  email: string;
}

const ResendLink = ({ email }: Props) => {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const resend = () => {
    setSent(false);
    startTransition(async () => {
      const result = await resendAction(email);
      if (result.ok) {
        setSent(true);
        return;
      }
      // No inline slot here — a bare link with no form. DESIGN.md routes a
      // transient failure like this to a toast carrying Retry.
      toast.error(result.error, {
        action: { label: "Retry", onClick: resend },
      });
    });
  };

  if (sent) {
    return <span className="text-text-tertiary">Link sent</span>;
  }

  return (
    <button
      type="button"
      onClick={resend}
      disabled={pending}
      className="text-accent-brand font-medium disabled:opacity-50"
    >
      {pending ? "Sending…" : "Resend link"}
    </button>
  );
};

export default ResendLink;
