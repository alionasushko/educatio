"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useOthers, useOthersListener } from "@liveblocks/react";

const MAX_AVATARS = 5;

const initials = (name: string) =>
  name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

const PresenceStack = () => {
  const others = useOthers();
  const settled = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      settled.current = true;
    }, 1_500);
    return () => clearTimeout(timer);
  }, []);

  useOthersListener(({ type, user }) => {
    if (!settled.current || type !== "enter") return;
    const name = user.presence.name;
    if (name) toast.success(`${name} joined the lesson`);
  });

  if (others.length === 0) return null;

  const shown = others.slice(0, MAX_AVATARS);
  const extra = others.length - shown.length;

  return (
    <div
      className="flex items-center"
      role="group"
      aria-label={`${others.length} other in the lesson`}
    >
      {shown.map(({ connectionId, presence }) => (
        <span
          key={connectionId}
          title={presence.name}
          className="ring-surface -ml-1.5 flex size-7 items-center justify-center rounded-full text-[10.5px] font-semibold text-white ring-2 first:ml-0"
          style={{ background: presence.color }}
        >
          {initials(presence.name)}
        </span>
      ))}
      {extra > 0 && (
        <span className="bg-bg text-text-secondary ring-surface -ml-1.5 flex size-7 items-center justify-center rounded-full text-[10.5px] font-semibold ring-2">
          +{extra}
        </span>
      )}
    </div>
  );
};

export default PresenceStack;
