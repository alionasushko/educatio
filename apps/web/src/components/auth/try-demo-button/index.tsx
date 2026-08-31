import { SparklesIcon } from "lucide-react";
import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  className?: string;
}

const TryDemoButton = ({
  label = "Explore the demo — no sign-up needed",
  className,
}: Props) => {
  return (
    <form action="/auth/demo" method="post">
      <Button
        type="submit"
        variant="outline"
        size="lg"
        className={cn("w-full", className)}
      >
        <SparklesIcon aria-hidden="true" />
        {label}
      </Button>
    </form>
  );
};

export default TryDemoButton;
