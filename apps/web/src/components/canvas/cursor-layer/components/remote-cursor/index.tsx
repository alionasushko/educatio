"use client";

import { useEffect, useState } from "react";
import type { ParticipantRole } from "@/lib/liveblocks.config";
import { cn } from "@/lib/utils";
import {
  CURSOR_IDLE_FADE_MS,
  NAME_PILL_FADE_MS,
} from "../../helpers/constants";

type Phase = "moving" | "still" | "idle";

interface Props {
  x: number;
  y: number;
  name: string;
  role: ParticipantRole;
  color: string;
}

const RemoteCursor = ({ x, y, name, role, color }: Props) => {
  const [phase, setPhase] = useState<Phase>("moving");
  const [lastPosition, setLastPosition] = useState({ x, y });

  if (lastPosition.x !== x || lastPosition.y !== y) {
    setLastPosition({ x, y });
    setPhase("moving");
  }

  useEffect(() => {
    const pill = setTimeout(() => setPhase("still"), NAME_PILL_FADE_MS);
    const idle = setTimeout(() => setPhase("idle"), CURSOR_IDLE_FADE_MS);
    return () => {
      clearTimeout(pill);
      clearTimeout(idle);
    };
  }, [x, y]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-0 left-0 z-20 transition-opacity duration-500",
        phase === "idle" ? "opacity-0" : "opacity-100",
      )}
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <svg
        width="18"
        height="22"
        viewBox="0 0 18 22"
        fill="none"
        aria-hidden="true"
        className="drop-shadow-[0_1px_2px_rgba(28,25,23,0.25)]"
      >
        <path
          d="M1 1L1 16.5L5.2 12.6L8.1 19.4L11 18.1L8.2 11.5L13.5 11.2L1 1Z"
          fill={color}
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={cn(
          "absolute top-5 left-4 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white transition-opacity duration-300",
          phase === "moving" ? "opacity-100" : "opacity-0",
        )}
        style={{ background: color }}
      >
        {name}
        {role === "tutor" ? " · tutor" : ""}
      </span>
    </div>
  );
};

export default RemoteCursor;
