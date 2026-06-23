import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  tone?: "accent" | "muted";
  className?: string;
}

const Eyebrow = ({ children, tone = "accent", className }: Props) => {
  return (
    <div
      className={cn(
        "text-[11px] font-semibold tracking-widest uppercase",
        tone === "accent" ? "text-accent-brand" : "text-text-tertiary",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Eyebrow;
