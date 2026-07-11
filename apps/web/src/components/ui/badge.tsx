import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "active" | "ended" | "draft" | "accent";

interface Props {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const VARIANTS: Record<
  BadgeVariant,
  { bg: string; color: string; border: string; dot: string }
> = {
  neutral: {
    bg: "var(--bg)",
    color: "var(--text-secondary)",
    border: "var(--border-subtle)",
    dot: "var(--text-tertiary)",
  },
  ended: {
    bg: "var(--bg)",
    color: "var(--text-secondary)",
    border: "var(--border-subtle)",
    dot: "var(--text-tertiary)",
  },
  active: {
    bg: "color-mix(in oklab, var(--success) 14%, var(--bg))",
    color: "color-mix(in oklab, var(--success) 80%, black)",
    border: "color-mix(in oklab, var(--success) 30%, var(--border-subtle))",
    dot: "var(--success)",
  },
  draft: {
    bg: "color-mix(in oklab, var(--warning) 14%, var(--bg))",
    color: "color-mix(in oklab, var(--warning) 82%, black)",
    border: "color-mix(in oklab, var(--warning) 28%, var(--border-subtle))",
    dot: "var(--warning)",
  },
  accent: {
    bg: "var(--accent-soft)",
    color: "var(--accent-brand)",
    border: "var(--accent-soft-border)",
    dot: "var(--accent-brand)",
  },
};

const Badge = ({
  children,
  variant = "neutral",
  dot = false,
  className,
}: Props) => {
  const v = VARIANTS[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium tracking-[0.01em]",
        className,
      )}
      style={{ background: v.bg, color: v.color, borderColor: v.border }}
    >
      {dot && (
        <span
          className="size-1.5 rounded-full"
          style={{
            background: v.dot,
            boxShadow:
              variant === "active"
                ? `0 0 0 3px color-mix(in oklab, ${v.dot} 22%, transparent)`
                : undefined,
          }}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
