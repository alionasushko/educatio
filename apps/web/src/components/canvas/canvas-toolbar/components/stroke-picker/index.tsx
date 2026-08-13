"use client";

import { STROKE_WIDTHS } from "../../../helpers/constants";
import { cn } from "@/lib/utils";

interface Props {
  selected: number;
  onSelect: (width: number) => void;
  disabled?: boolean;
}

const StrokePicker = ({ selected, onSelect, disabled }: Props) => (
  <div
    role="group"
    aria-label="Stroke width"
    className="flex items-center gap-1"
  >
    {STROKE_WIDTHS.map(({ width, label }) => {
      const active = width === selected;
      return (
        <button
          key={width}
          type="button"
          aria-label={`${label} stroke`}
          aria-pressed={active}
          title={`${label} stroke`}
          disabled={disabled}
          onClick={() => onSelect(width)}
          className={cn(
            "flex size-7 cursor-pointer items-center justify-center rounded-[8px] transition-colors",
            "focus-visible:outline-accent-brand focus-visible:outline-2 focus-visible:outline-offset-2",
            "disabled:pointer-events-none disabled:opacity-35",
            active ? "bg-accent-tint" : "hover:bg-accent-tint/60",
          )}
        >
          <span
            className={cn(
              "block w-4 rounded-full",
              active ? "bg-accent-brand" : "bg-text-secondary",
            )}
            style={{ height: Math.min(width, 6) }}
          />
        </button>
      );
    })}
  </div>
);

export default StrokePicker;
