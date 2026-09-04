import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

const FormError = ({ children, className }: Props) => (
  <p
    role="alert"
    className={cn("text-destructive text-[13px] leading-snug", className)}
  >
    {children}
  </p>
);

export default FormError;
