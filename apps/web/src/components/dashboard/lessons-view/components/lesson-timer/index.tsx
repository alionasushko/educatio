"use client";

import { useEffect, useState } from "react";
import type { Lesson } from "@educatio/shared";

interface Props {
  startedAt: NonNullable<Lesson["startedAt"]>;
}

const formatElapsed = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
};

const LessonTimer = ({ startedAt }: Props) => {
  const start = new Date(startedAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  if (Number.isNaN(start)) return <span>—</span>;
  return <span suppressHydrationWarning>{formatElapsed(now - start)}</span>;
};

export default LessonTimer;
