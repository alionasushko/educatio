import { UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  name?: string;
  color?: string;
  size?: number;
  className?: string;
}

const PALETTE = [
  "var(--avatar-1)",
  "var(--avatar-2)",
  "var(--avatar-3)",
  "var(--avatar-4)",
  "var(--avatar-5)",
  "var(--avatar-6)",
];

const colorFromName = (name: string): string => {
  let h = 0;
  for (const char of name) h = (h * 31 + char.charCodeAt(0)) & 0xffff;
  return PALETTE[h % PALETTE.length];
};

const initialsFromName = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Avatar = ({ name, color, size = 28, className }: Props) => {
  const trimmed = name?.trim();

  if (!trimmed) {
    return (
      <span
        className={cn(
          "border-border-subtle text-text-tertiary bg-bg inline-flex shrink-0 items-center justify-center rounded-full border",
          className,
        )}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <UserIcon style={{ width: size * 0.5, height: size * 0.5 }} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        letterSpacing: "0.02em",
        background: color ?? colorFromName(trimmed),
      }}
      aria-hidden="true"
    >
      {initialsFromName(trimmed)}
    </span>
  );
};

export default Avatar;
