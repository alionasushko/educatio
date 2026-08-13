"use client";

import { useCallback, useRef, useState } from "react";
import type Konva from "konva";
import { Layer, Stage } from "react-konva";
import {
  useRedo,
  useStorageRoot,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react";
import type { CanvasTool } from "@/lib/liveblocks.config";
import { GRID_SIZE } from "./helpers/constants";
import { useStageSize } from "./helpers/use-stage-size";
import { useViewport } from "./helpers/use-viewport";
import { useCanvasShortcuts } from "./helpers/use-canvas-shortcuts";
import {
  useCreateElement,
  useCreatePath,
  useDeleteElement,
} from "./helpers/use-canvas-mutations";
import { usePen } from "./helpers/use-pen";
import { isCreatable } from "./helpers/helpers";
import CanvasElements from "./components/canvas-elements";
import DraftStroke from "./components/draft-stroke";
import SelectionOverlay from "./components/selection-overlay";
import TextEditor from "./components/text-editor";

interface Props {
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
}

const CanvasStage = ({ tool, onToolChange }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useStageSize(containerRef);
  const { viewport, panning, spaceHeld, handlers } = useViewport(containerRef);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [storageRoot] = useStorageRoot();
  const storageReady = storageRoot !== null;

  const updateMyPresence = useUpdateMyPresence();
  const createElement = useCreateElement();
  const createPath = useCreatePath();
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
  const handleDeselect = useCallback(() => {
    select(null);
    setEditingId(null);
  }, [select]);
  const handleEdit = useCallback((id: string) => setEditingId(id), []);

  const handleStageClick = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = event.target.getStage();
      if (event.target !== stage) return;

      setEditingId(null);

      if (!isCreatable(tool)) {
        select(null);
        return;
      }

      if (!storageReady) return;

      const point = stage?.getRelativePointerPosition();
      if (!point) return;

      const id = createElement(tool, point.x, point.y);
      select(id);
      setEditingId(id);
      onToolChange("select");
    },
    [tool, storageReady, createElement, select, onToolChange],
  );

  const handleDelete = useCallback(() => {
    if (!selectedId || editingId) return;
    deleteElement(selectedId);
    select(null);
  }, [selectedId, editingId, deleteElement, select]);

  const pen = usePen({
    containerRef,
    viewport,
    tool,
    enabled: storageReady && !spaceHeld,
    onCommit: createPath,
  });

  const pointerHandlers = {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      handlers.onPointerDown(event);
      pen.handlers.onPointerDown(event);
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      handlers.onPointerMove(event);
      pen.handlers.onPointerMove(event);
    },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      handlers.onPointerUp(event);
      pen.handlers.onPointerUp();
    },
  };

  useCanvasShortcuts({
    onDelete: handleDelete,
    onDeselect: handleDeselect,
    onUndo: undo,
    onRedo: redo,
    onTool: onToolChange,
  });

  const dot = GRID_SIZE * viewport.scale;
  const cursor = panning
    ? "grabbing"
    : spaceHeld
      ? "grab"
      : tool !== "select"
        ? "crosshair"
        : "default";

  return (
    <div
      ref={containerRef}
      className="group bg-bg relative h-full w-full touch-none overflow-hidden"
      style={{ cursor }}
      {...pointerHandlers}
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
          <Layer listening={tool === "select"}>
            <CanvasElements onSelect={handleSelect} onEdit={handleEdit} />
            <SelectionOverlay selectedId={selectedId} scale={viewport.scale} />
            {pen.draft && (
              <DraftStroke
                x={pen.draft.x}
                y={pen.draft.y}
                points={pen.draft.points}
              />
            )}
          </Layer>
        </Stage>
      )}

      {editingId && (
        <TextEditor
          key={editingId}
          elementId={editingId}
          viewport={viewport}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
};

export default CanvasStage;
