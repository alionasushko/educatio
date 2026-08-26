"use client";

import { ImageIcon } from "lucide-react";

const DropOverlay = () => (
  <div className="bg-accent-tint/80 border-accent-brand pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-[16px] border-2 border-dashed backdrop-blur-[1px]">
    <div className="bg-surface border-border-subtle flex items-center gap-2 rounded-full border px-4 py-2 shadow-(--shadow-medium)">
      <ImageIcon
        className="text-accent-brand size-4"
        strokeWidth={2}
        aria-hidden="true"
      />
      <span className="text-text-primary text-sm font-medium">
        Drop to add image
      </span>
    </div>
  </div>
);

export default DropOverlay;
