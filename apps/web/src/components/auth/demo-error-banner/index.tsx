"use client";

import { useSearchParams } from "next/navigation";
import { TriangleAlertIcon } from "lucide-react";

const DemoErrorBanner = () => {
  const error = useSearchParams().get("error");
  if (error !== "demo-unavailable") return null;

  return (
    <div
      role="alert"
      className="border-destructive/20 bg-destructive/10 text-destructive mb-6 flex items-start gap-2.5 rounded-[10px] border px-4 py-3 text-[13px] leading-normal"
    >
      <TriangleAlertIcon className="mt-px size-4 shrink-0" aria-hidden="true" />
      <p>
        The demo isn&apos;t available right now — create an account to continue.
      </p>
    </div>
  );
};

export default DemoErrorBanner;
