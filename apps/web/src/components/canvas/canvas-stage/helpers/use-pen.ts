import { useCallback, useRef, useState } from "react";
import { useUpdateMyPresence } from "@liveblocks/react";
import type { CanvasTool } from "@/lib/liveblocks.config";
import { PEN_MIN_DISTANCE } from "./constants";
import { toCanvasPoint } from "./helpers";
import type { Viewport } from "./types";

interface Draft {
  x: number;
  y: number;
  points: number[];
}

interface Options {
  container: HTMLDivElement | null;
  viewport: Viewport;
  tool: CanvasTool;
  enabled: boolean;
  stroke: string;
  strokeWidth: number;
  onCommit: (x: number, y: number, points: number[]) => void;
}

export const usePen = ({
  container,
  viewport,
  tool,
  enabled,
  stroke,
  strokeWidth,
  onCommit,
}: Options) => {
  const [draft, setDraft] = useState<Draft | null>(null);
  const current = useRef<Draft | null>(null);
  const updateMyPresence = useUpdateMyPresence();

  const broadcast = useCallback(
    (next: Draft | null) => {
      updateMyPresence({
        draft: next ? { ...next, stroke, strokeWidth } : null,
      });
    },
    [updateMyPresence, stroke, strokeWidth],
  );

  const toCanvas = useCallback(
    (clientX: number, clientY: number) =>
      toCanvasPoint(container, viewport, clientX, clientY),
    [container, viewport],
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
      broadcast(started);
    },
    [enabled, tool, toCanvas, broadcast],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const inProgress = current.current;
      if (!inProgress) return;
      const point = toCanvas(event.clientX, event.clientY);
      if (!point) return;

      const x = point.x - inProgress.x;
      const y = point.y - inProgress.y;
      const { points } = inProgress;
      const dx = x - (points[points.length - 2] ?? 0);
      const dy = y - (points[points.length - 1] ?? 0);
      if (Math.hypot(dx, dy) * viewport.scale < PEN_MIN_DISTANCE) return;

      const next = { ...inProgress, points: [...points, x, y] };
      current.current = next;
      setDraft(next);
      broadcast(next);
    },
    [toCanvas, viewport.scale, broadcast],
  );

  const onPointerUp = useCallback(() => {
    const finished = current.current;
    if (!finished) return;
    current.current = null;
    setDraft(null);
    broadcast(null);
    if (finished.points.length >= 4) {
      onCommit(finished.x, finished.y, finished.points);
    }
  }, [onCommit, broadcast]);

  return {
    draft,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
  };
};
