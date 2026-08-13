"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  shortcut: string;
  Icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

const ToolButton = ({
  label,
  shortcut,
  Icon,
  onClick,
  active,
  disabled,
}: Props) => (
  <button
    type="button"
    aria-label={`${label} (${shortcut})`}
    aria-pressed={active}
    title={`${label} — ${shortcut}`}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex size-9 cursor-pointer items-center justify-center rounded-[10px] transition-colors",
      "focus-visible:outline-accent-brand focus-visible:outline-2 focus-visible:outline-offset-2",
      "disabled:pointer-events-none disabled:opacity-35",
      active
        ? "bg-accent-brand text-white"
        : "text-text-secondary hover:bg-accent-tint hover:text-text-primary",
    )}
  >
    <Icon
      className="size-4.5"
      strokeWidth={active ? 2.4 : 1.8}
      aria-hidden="true"
    />
  </button>
);

export default ToolButton;
