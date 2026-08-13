import { useCallback, useRef, useState, type RefObject } from "react";
import type { CanvasTool } from "@/lib/liveblocks.config";
import { PEN_MIN_DISTANCE } from "./constants";
import type { Viewport } from "./types";

interface Draft {
  x: number;
  y: number;
  points: number[];
}

interface Options {
  containerRef: RefObject<HTMLDivElement | null>;
  viewport: Viewport;
  tool: CanvasTool;
  enabled: boolean;
  onCommit: (x: number, y: number, points: number[]) => void;
}

export const usePen = ({
  containerRef,
  viewport,
  tool,
  enabled,
  onCommit,
}: Options) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const current = useRef<Draft | null>(null);

  const toCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return {
        x: (clientX - rect.left - viewport.x) / viewport.scale,
        y: (clientY - rect.top - viewport.y) / viewport.scale,
      };
    },
    [containerRef, viewport.x, viewport.y, viewport.scale],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled || tool !== "pen" || event.button !== 0) return;
      const point = toCanvas(event.clientX, event.clientY);
      if (!point) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      const started = { x: point.x, y: point.y, points: [0, 0] };
      current.current = started;
      setDraft(started);
    },
    [enabled, tool, toCanvas],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const stroke = current.current;
      if (!stroke) return;
      const point = toCanvas(event.clientX, event.clientY);
      if (!point) return;

      const x = point.x - stroke.x;
      const y = point.y - stroke.y;
      const { points } = stroke;
      const dx = x - (points[points.length - 2] ?? 0);
      const dy = y - (points[points.length - 1] ?? 0);
      if (Math.hypot(dx, dy) * viewport.scale < PEN_MIN_DISTANCE) return;

      const next = { ...stroke, points: [...points, x, y] };
      current.current = next;
      setDraft(next);
    },
    [toCanvas, viewport.scale],
  );

  const onPointerUp = useCallback(() => {
    const stroke = current.current;
    if (!stroke) return;
    current.current = null;
    setDraft(null);
    if (stroke.points.length >= 4) {
      onCommit(stroke.x, stroke.y, stroke.points);
    }
  }, [onCommit]);

  return {
    draft,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
  };
};
