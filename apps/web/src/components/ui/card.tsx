import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  padding?: number;
  className?: string;
}

const Card = ({ children, padding = 24, className }: Props) => {
  return (
    <div
      className={cn(
        "border-border-subtle bg-surface rounded-md border",
        className,
      )}
      style={{ padding, boxShadow: "var(--shadow-subtle)" }}
    >
      {children}
    </div>
  );
};

export default Card;
