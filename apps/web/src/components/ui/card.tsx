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
        "border-border-subtle bg-surface rounded-md border shadow-(--shadow-subtle)",
        className,
      )}
      style={{ padding }}
    >
      {children}
    </div>
  );
};

export default Card;
