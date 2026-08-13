"use client";

import { useCallback, useRef, useState } from "react";
import type Konva from "konva";
import { Layer, Stage } from "react-konva";
import { useRedo, useUndo, useUpdateMyPresence } from "@liveblocks/react";
import { GRID_SIZE } from "./helpers/constants";
import { useStageSize } from "./helpers/use-stage-size";
import { useViewport } from "./helpers/use-viewport";
import { useCanvasShortcuts } from "./helpers/use-canvas-shortcuts";
import { useDeleteElement } from "./helpers/use-canvas-mutations";
import CanvasElements from "./components/canvas-elements";
import SelectionOverlay from "./components/selection-overlay";

const CanvasStage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useStageSize(containerRef);
  const { viewport, panning, spaceHeld, handlers } = useViewport(containerRef);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const updateMyPresence = useUpdateMyPresence();
  const deleteElement = useDeleteElement();
  const undo = useUndo();
  const redo = useRedo();

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      updateMyPresence({ selection: id ? [id] : null });
    },
    [updateMyPresence],
  );

  const handleSelect = useCallback((id: string) => select(id), [select]);
  const handleDeselect = useCallback(() => select(null), [select]);

  const handleStageClick = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (event.target === event.target.getStage()) handleDeselect();
    },
    [handleDeselect],
  );

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    deleteElement(selectedId);
    select(null);
  }, [selectedId, deleteElement, select]);

  useCanvasShortcuts({
    onDelete: handleDelete,
    onDeselect: handleDeselect,
    onUndo: undo,
    onRedo: redo,
  });

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
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          <Layer>
            <CanvasElements onSelect={handleSelect} />
            <SelectionOverlay selectedId={selectedId} scale={viewport.scale} />
          </Layer>
        </Stage>
      )}
    </div>
  );
};

export default CanvasStage;
