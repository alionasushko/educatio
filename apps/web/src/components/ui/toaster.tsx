"use client";

import { Toaster as SonnerToaster } from "sonner";

const Toaster = () => (
  <SonnerToaster
    position="top-center"
    duration={5000}
    visibleToasts={3}
    gap={10}
    toastOptions={{
      classNames: {
        toast:
          "!bg-surface !border-border-subtle !text-text-primary !rounded-[12px] !border !shadow-(--shadow-large)",
        title: "!text-[13.5px] !font-medium",
        description: "!text-text-secondary !text-[13px]",
        actionButton: "!bg-accent-brand !text-white",
        error: "!text-destructive",
        success: "!text-accent-brand",
      },
    }}
  />
);

export default Toaster;
