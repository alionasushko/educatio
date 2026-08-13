import { useEffect, useState, type RefObject } from "react";
import type { StageSize } from "./types";

export const useStageSize = (
  containerRef: RefObject<HTMLDivElement | null>,
): StageSize => {
  const [size, setSize] = useState<StageSize>({ width: 0, height: 0 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [containerRef]);

  return size;
};
