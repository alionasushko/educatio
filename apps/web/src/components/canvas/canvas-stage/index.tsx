"use client";

import { useRef } from "react";
import { Layer, Stage } from "react-konva";
import { GRID_SIZE } from "./helpers/constants";
import { useStageSize } from "./helpers/use-stage-size";
import { useViewport } from "./helpers/use-viewport";
import CanvasElements from "./components/canvas-elements";

const CanvasStage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useStageSize(containerRef);
  const { viewport, panning, spaceHeld, handlers } = useViewport(containerRef);

  const dot = GRID_SIZE * viewport.scale;

  return (
    <div
      ref={containerRef}
      className="group bg-bg relative h-full w-full touch-none overflow-hidden"
      style={{ cursor: panning ? "grabbing" : spaceHeld ? "grab" : "default" }}
      {...handlers}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border-medium) 1px, transparent 1px)",
          backgroundSize: `${dot}px ${dot}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />
      {width > 0 && height > 0 && (
        <Stage
          width={width}
          height={height}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
        >
          <Layer listening={false}>
            <CanvasElements />
          </Layer>
        </Stage>
      )}
    </div>
  );
};

export default CanvasStage;
