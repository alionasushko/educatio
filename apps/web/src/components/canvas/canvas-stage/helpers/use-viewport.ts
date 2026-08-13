import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { INITIAL_VIEWPORT, ZOOM_INTENSITY } from "./constants";
import { isTypingTarget, panBy, zoomAt } from "./helpers";
import type { Viewport } from "./types";

export const useViewport = (containerRef: RefObject<HTMLDivElement | null>) => {
  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEWPORT);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
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

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [containerRef]);

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

  return {
    viewport,
    panning,
    spaceHeld,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
  };
};
