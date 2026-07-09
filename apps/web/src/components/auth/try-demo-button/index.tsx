import { SparklesIcon } from "lucide-react";
import Button from "@/components/ui/button";

const TryDemoButton = () => {
  return (
    <form action="/auth/demo" method="post">
      <Button type="submit" variant="outline" size="lg" className="w-full">
        <SparklesIcon aria-hidden="true" />
        Explore the demo — no sign-up needed
      </Button>
    </form>
  );
};

export default TryDemoButton;
