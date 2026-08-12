"use client";

import { useStatus } from "@liveblocks/react";
import Badge from "@/components/ui/badge";

const ConnectionStatus = () => {
  const status = useStatus();

  if (status === "initial" || status === "connected") return null;

  const lost = status === "disconnected";

  return (
    <span role="status" aria-live="polite">
      <Badge variant={lost ? "neutral" : "draft"} dot>
        {lost ? "Connection lost" : "Reconnecting…"}
      </Badge>
    </span>
  );
};

export default ConnectionStatus;
