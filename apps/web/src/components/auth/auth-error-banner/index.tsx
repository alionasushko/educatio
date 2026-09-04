"use client";

import { useSearchParams } from "next/navigation";
import { TriangleAlertIcon } from "lucide-react";
import { ERROR_COPY } from "@/lib/error-messages";

const MESSAGES: Record<string, string> = {
  "invalid-token": `${ERROR_COPY.invalid_token} Request a fresh sign-in link below.`,
  "demo-unavailable": `${ERROR_COPY.demo_disabled} Create an account to continue.`,
  "wrong-device":
    "Open that link in the browser you asked for it from — sign-in links don't travel between devices.",
  "session-expired":
    "You were signed out — sign in again to pick up where you left off.",
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
