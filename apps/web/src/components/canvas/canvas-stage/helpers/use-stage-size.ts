import { useEffect, useState } from "react";
import type { StageSize } from "./types";

export const useStageSize = (container: HTMLDivElement | null): StageSize => {
  const [size, setSize] = useState<StageSize>({ width: 0, height: 0 });

  useEffect(() => {
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [container]);

  return size;
};
