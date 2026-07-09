"use client";

import { useSearchParams } from "next/navigation";
import { TriangleAlertIcon } from "lucide-react";

const MESSAGES: Record<string, string> = {
  "invalid-token":
    "That sign-in link was invalid or has expired — request a fresh one below.",
  "demo-unavailable":
    "The demo isn’t available right now — create an account to continue.",
};

const AuthErrorBanner = () => {
  const code = useSearchParams().get("error");
  const message = code && Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : null;
  if (!message) return null;

  return (
    <div
      role="alert"
      className="border-destructive/20 bg-destructive/10 text-destructive mb-6 flex items-start gap-2.5 rounded-[10px] border px-4 py-3 text-[13px] leading-normal"
    >
      <TriangleAlertIcon className="mt-px size-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
};

export default AuthErrorBanner;
