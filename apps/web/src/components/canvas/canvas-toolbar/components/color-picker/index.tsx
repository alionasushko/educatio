"use client";

import { cn } from "@/lib/utils";

export interface Swatch {
  token: string;
  label: string;
  value: string;
}

interface Props {
  label: string;
  swatches: Swatch[];
  selected: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

const ColorPicker = ({
  label,
  swatches,
  selected,
  onSelect,
  disabled,
}: Props) => (
  <div role="group" aria-label={label} className="flex items-center gap-1">
    {swatches.map((swatch) => {
      const active = swatch.value === selected;
      return (
        <button
          key={swatch.value}
          type="button"
          aria-label={swatch.label}
          aria-pressed={active}
          title={swatch.label}
          disabled={disabled}
          onClick={() => onSelect(swatch.value)}
          className={cn(
            "flex size-7 cursor-pointer items-center justify-center rounded-full transition-transform",
            "focus-visible:outline-accent-brand focus-visible:outline-2 focus-visible:outline-offset-2",
            "disabled:pointer-events-none disabled:opacity-35",
            active ? "scale-110" : "hover:scale-105",
          )}
        >
          <span
            className={cn(
              "block size-4.5 rounded-full",
              active
                ? "ring-text-primary ring-2 ring-offset-2"
                : "ring-border-medium ring-1",
            )}
            style={{
              background: `var(${swatch.token})`,
              ...(active
                ? { ["--tw-ring-offset-color"]: "var(--surface)" }
                : {}),
            }}
          />
        </button>
      );
    })}
  </div>
);

export default ColorPicker;
