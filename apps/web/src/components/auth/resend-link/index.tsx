"use client";

import { useState, useTransition } from "react";
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
      if (result.ok) setSent(true);
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
