"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

interface Props {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
}

const CascadeUp = ({
  children,
  delay = 0,
  y = 14,
  duration = 620,
  className,
}: Props) => {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  const shown = reduced || visible;

  return (
    <div
      className={className}
      style={{
        transform: shown ? "none" : `translateY(${y}px)`,
        opacity: shown ? 1 : 0,
        transition: reduced
          ? "none"
          : `transform ${duration}ms ${EASE_OUT} ${delay}ms, opacity ${duration}ms ${EASE_OUT} ${delay}ms`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
};

export default CascadeUp;
