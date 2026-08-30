import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_VIEWPORT, ZOOM_INTENSITY, ZOOM_STEPS } from "./constants";
import { isTypingTarget, panBy, zoomAt } from "./helpers";
import type { Viewport } from "./types";

interface Point {
  x: number;
  y: number;
}

interface Pinch {
  distance: number;
  midpoint: Point;
  viewport: Viewport;
}

const midpointOf = (a: Point, b: Point): Point => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

const distanceOf = (a: Point, b: Point): number =>
  Math.hypot(b.x - a.x, b.y - a.y);

interface Options {
  panWithPrimary?: boolean;
}

export const useViewport = (
  container: HTMLDivElement | null,
  { panWithPrimary = false }: Options = {},
) => {
  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEWPORT);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const [pinching, setPinching] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const touches = useRef(new Map<number, Point>());
  const pinch = useRef<Pinch | null>(null);
  const latest = useRef(viewport);

  useEffect(() => {
    latest.current = viewport;
  }, [viewport]);

  useEffect(() => {
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = container.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey) {
        const factor = Math.exp(-event.deltaY * ZOOM_INTENSITY);
        setViewport((current) =>
          zoomAt(
            current,
            event.clientX - rect.left,
            event.clientY - rect.top,
            factor,
          ),
        );
        return;
      }
      setViewport((current) => panBy(current, -event.deltaX, -event.deltaY));
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [container]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isTypingTarget(event.target)) return;
      event.preventDefault();
      setSpaceHeld(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpaceHeld(false);
    };
    const onBlur = () => setSpaceHeld(false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const localPoint = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const rect = container?.getBoundingClientRect();
      if (!rect) return null;
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [container],
  );

  const endTouch = useCallback((pointerId: number) => {
    if (!touches.current.delete(pointerId)) return;
    if (touches.current.size < 2 && pinch.current) {
      pinch.current = null;
      setPinching(false);
    }
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") {
        const point = localPoint(event.clientX, event.clientY);
        if (!point) return;
        touches.current.set(event.pointerId, point);
        const [a, b] = [...touches.current.values()];
        if (touches.current.size !== 2 || !a || !b) return;
        pinch.current = {
          distance: distanceOf(a, b),
          midpoint: midpointOf(a, b),
          viewport: latest.current,
        };
        setPinching(true);
        return;
      }

      const middleClick = event.button === 1;
      const spaceDrag = event.button === 0 && (spaceHeld || panWithPrimary);
      if (!middleClick && !spaceDrag) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      last.current = { x: event.clientX, y: event.clientY };
      setPanning(true);
    },
    [spaceHeld, panWithPrimary, localPoint],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType === "touch") {
        if (!touches.current.has(event.pointerId)) return;
        const point = localPoint(event.clientX, event.clientY);
        if (!point) return;
        touches.current.set(event.pointerId, point);

        const base = pinch.current;
        const [a, b] = [...touches.current.values()];
        if (!base || touches.current.size !== 2 || !a || !b) return;

        const distance = distanceOf(a, b);
        if (distance === 0) return;
        const midpoint = midpointOf(a, b);
        const zoomed = zoomAt(
          base.viewport,
          base.midpoint.x,
          base.midpoint.y,
          distance / base.distance,
        );
        setViewport(
          panBy(
            zoomed,
            midpoint.x - base.midpoint.x,
            midpoint.y - base.midpoint.y,
          ),
        );
        return;
      }

      const previous = last.current;
      if (!previous) return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      last.current = { x: event.clientX, y: event.clientY };
      setViewport((current) => panBy(current, dx, dy));
    },
    [localPoint],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") {
        endTouch(event.pointerId);
        return;
      }
      if (!last.current) return;
      last.current = null;
      setPanning(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [endTouch],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => endTouch(event.pointerId),
    [endTouch],
  );

  const zoomStep = useCallback(
    (direction: 1 | -1) => {
      const rect = container?.getBoundingClientRect();
      if (!rect) return;
      setViewport((current) => {
        const next =
          direction > 0
            ? ZOOM_STEPS.find((step) => step > current.scale + 0.001)
            : [...ZOOM_STEPS]
                .reverse()
                .find((step) => step < current.scale - 0.001);
        return next
          ? zoomAt(
              current,
              rect.width / 2,
              rect.height / 2,
              next / current.scale,
            )
          : current;
      });
    },
    [container],
  );

  const resetZoom = useCallback(() => setViewport(INITIAL_VIEWPORT), []);

  return {
    viewport,
    panning,
    spaceHeld,
    pinching,
    zoomStep,
    resetZoom,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
};
