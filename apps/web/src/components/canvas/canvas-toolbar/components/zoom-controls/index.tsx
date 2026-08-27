"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ZOOM_STEPS } from "../../../canvas-stage/helpers/constants";

interface Props {
  scale: number;
  onZoom: (direction: 1 | -1) => void;
  onReset: () => void;
  disabled?: boolean;
}

const step =
  "flex size-7 cursor-pointer items-center justify-center rounded-[8px] transition-colors focus-visible:outline-accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-35 text-text-secondary hover:bg-accent-tint hover:text-text-primary";

const ZoomControls = ({ scale, onZoom, onReset, disabled }: Props) => (
  <div role="group" aria-label="Zoom" className="flex items-center gap-0.5">
    <button
      type="button"
      aria-label="Zoom out"
      title="Zoom out"
      disabled={disabled || scale <= (ZOOM_STEPS[0] ?? 0.25)}
      onClick={() => onZoom(-1)}
      className={step}
    >
      <MinusIcon className="size-4" strokeWidth={2} aria-hidden="true" />
    </button>
    <button
      type="button"
      aria-label={`Zoom ${Math.round(scale * 100)}%, reset to 100%`}
      title="Reset zoom"
      disabled={disabled}
      onClick={onReset}
      className={cn(
        "text-text-secondary hover:text-text-primary hover:bg-accent-tint focus-visible:outline-accent-brand min-w-11 cursor-pointer rounded-sm px-1 py-1 text-center text-[11.5px] font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-35",
      )}
    >
      {Math.round(scale * 100)}%
    </button>
    <button
      type="button"
      aria-label="Zoom in"
      title="Zoom in"
      disabled={disabled || scale >= (ZOOM_STEPS.at(-1) ?? 4)}
      onClick={() => onZoom(1)}
      className={step}
    >
      <PlusIcon className="size-4" strokeWidth={2} aria-hidden="true" />
    </button>
  </div>
);

export default ZoomControls;
