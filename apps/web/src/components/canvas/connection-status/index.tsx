"use client";

import { useStatus } from "@liveblocks/react";
import Badge from "@/components/ui/badge";

const ConnectionStatus = () => {
  const status = useStatus();
  const settled = status === "initial" || status === "connected";
  const lost = status === "disconnected";

  return (
    <span role="status" aria-live="polite">
      {!settled && (
        <Badge variant={lost ? "neutral" : "draft"} dot>
          {lost ? "Connection lost" : "Reconnecting…"}
        </Badge>
      )}
    </span>
  );
};

export default ConnectionStatus;
