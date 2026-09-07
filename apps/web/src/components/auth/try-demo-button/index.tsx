"use client";

import { useEffect, useState } from "react";
import { SparklesIcon } from "lucide-react";
import Button from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  className?: string;
}

const TryDemoButton = ({
  label = "Explore the demo — no sign-up needed",
  className,
}: Props) => {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(false);
    };
    window.addEventListener("pageshow", restored);
    return () => window.removeEventListener("pageshow", restored);
  }, []);

  return (
    <form
      action="/auth/demo"
      method="post"
      onSubmit={(event) => {
        if (pending) event.preventDefault();
        else setPending(true);
      }}
    >
      <Button
        type="submit"
        variant="outline"
        size="lg"
        aria-busy={pending}
        className={cn("w-full", className)}
      >
        {pending ? <Spinner /> : <SparklesIcon aria-hidden="true" />}
        {pending ? "Opening the demo…" : label}
      </Button>
    </form>
  );
};

export default TryDemoButton;
