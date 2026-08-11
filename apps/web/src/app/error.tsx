"use client";

import { useEffect } from "react";
import Button from "@/components/ui/button";
import MessageScreen from "@/components/ui/message-screen";

interface Props {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

const RouteError = ({ error, unstable_retry }: Props) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MessageScreen
      title="Something went wrong"
      body="That's on us, not you. Trying again often clears it — if it doesn't, your lessons are safe and waiting on the dashboard."
      href="/dashboard"
      linkLabel="Back to dashboard"
      action={
        <Button onClick={() => unstable_retry()} className="h-10 px-4 text-sm">
          Try again
        </Button>
      }
    />
  );
};

export default RouteError;
