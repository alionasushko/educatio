"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

interface Props {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}

const FadeUp = ({
  children,
  delay = 0,
  y = 14,
  duration = 620,
  threshold = 0.15,
  className,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, reduced]);

  const shown = reduced || inView;

  return (
    <div
      ref={ref}
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

export default FadeUp;
