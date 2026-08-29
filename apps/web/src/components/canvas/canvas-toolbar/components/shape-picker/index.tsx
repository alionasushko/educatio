"use client";

import { CircleIcon, MoveUpRightIcon, SquareIcon } from "lucide-react";
import type { ShapeKind } from "@educatio/shared";
import { SHAPE_LABEL, SHAPE_ORDER } from "../../../helpers/constants";
import { cn } from "@/lib/utils";

const SHAPE_ICON: Record<ShapeKind, typeof SquareIcon> = {
  rectangle: SquareIcon,
  circle: CircleIcon,
  arrow: MoveUpRightIcon,
};

interface Props {
  selected: ShapeKind;
  onSelect: (shape: ShapeKind) => void;
  disabled?: boolean;
}

const ShapePicker = ({ selected, onSelect, disabled }: Props) => (
  <div role="group" aria-label="Shape" className="flex items-center gap-1">
    {SHAPE_ORDER.map((shape) => {
      const Icon = SHAPE_ICON[shape];
      const active = shape === selected;
      return (
        <button
          key={shape}
          type="button"
          aria-label={SHAPE_LABEL[shape]}
          aria-pressed={active}
          title={SHAPE_LABEL[shape]}
          disabled={disabled}
          onClick={() => onSelect(shape)}
          className={cn(
            "flex size-7 cursor-pointer items-center justify-center rounded-sm transition-colors",
            "focus-visible:outline-accent-brand focus-visible:outline-2 focus-visible:outline-offset-2",
            "disabled:pointer-events-none disabled:opacity-35",
            active ? "bg-accent-tint" : "hover:bg-accent-tint/60",
          )}
        >
          <Icon
            className={cn(
              "size-4",
              active ? "text-accent-brand" : "text-text-secondary",
            )}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </button>
      );
    })}
  </div>
);

export default ShapePicker;
