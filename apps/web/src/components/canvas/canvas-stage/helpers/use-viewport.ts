import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_VIEWPORT, ZOOM_INTENSITY, ZOOM_STEPS } from "./constants";
import { isTypingTarget, panBy, zoomAt } from "./helpers";
import type { Viewport } from "./types";

export const useViewport = (container: HTMLDivElement | null) => {
  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEWPORT);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);

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

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const middleClick = event.button === 1;
      const spaceDrag = event.button === 0 && spaceHeld;
      if (!middleClick && !spaceDrag) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      last.current = { x: event.clientX, y: event.clientY };
      setPanning(true);
    },
    [spaceHeld],
  );

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const previous = last.current;
    if (!previous) return;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    last.current = { x: event.clientX, y: event.clientY };
    setViewport((current) => panBy(current, dx, dy));
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!last.current) return;
      last.current = null;
      setPanning(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
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
    zoomStep,
    resetZoom,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
  };
};
