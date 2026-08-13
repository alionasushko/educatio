"use client";

import { useCallback, useRef, useState } from "react";
import type Konva from "konva";
import { Layer, Stage } from "react-konva";
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react";
import type { CanvasTool } from "@/lib/liveblocks.config";
import CanvasToolbar from "../canvas-toolbar";
import { GRID_SIZE } from "./helpers/constants";
import { useStageSize } from "./helpers/use-stage-size";
import { useViewport } from "./helpers/use-viewport";
import { useCanvasShortcuts } from "./helpers/use-canvas-shortcuts";
import {
  useCreateElement,
  useDeleteElement,
} from "./helpers/use-canvas-mutations";
import { isCreatable } from "./helpers/helpers";
import CanvasElements from "./components/canvas-elements";
import SelectionOverlay from "./components/selection-overlay";
import TextEditor from "./components/text-editor";

const CanvasStage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useStageSize(containerRef);
  const { viewport, panning, spaceHeld, handlers } = useViewport(containerRef);

  const [tool, setTool] = useState<CanvasTool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateMyPresence = useUpdateMyPresence();
  const createElement = useCreateElement();
  const deleteElement = useDeleteElement();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      updateMyPresence({ selection: id ? [id] : null });
    },
    [updateMyPresence],
  );

  const changeTool = useCallback(
    (next: CanvasTool) => {
      setTool(next);
      updateMyPresence({ tool: next });
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

      const point = stage?.getRelativePointerPosition();
      if (!point) return;

      const id = createElement(tool, point.x, point.y);
      select(id);
      setEditingId(id);
      changeTool("select");
    },
    [tool, createElement, select, changeTool],
  );

  const handleDelete = useCallback(() => {
    if (!selectedId || editingId) return;
    deleteElement(selectedId);
    select(null);
  }, [selectedId, editingId, deleteElement, select]);

  useCanvasShortcuts({
    onDelete: handleDelete,
    onDeselect: handleDeselect,
    onUndo: undo,
    onRedo: redo,
    onTool: changeTool,
  });

  const dot = GRID_SIZE * viewport.scale;
  const cursor = panning
    ? "grabbing"
    : spaceHeld
      ? "grab"
      : isCreatable(tool)
        ? "crosshair"
        : "default";

  return (
    <div
      ref={containerRef}
      className="group bg-bg relative h-full w-full touch-none overflow-hidden"
      style={{ cursor }}
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
            <CanvasElements onSelect={handleSelect} onEdit={handleEdit} />
            <SelectionOverlay selectedId={selectedId} scale={viewport.scale} />
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

      <CanvasToolbar
        tool={tool}
        onToolChange={changeTool}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
};

export default CanvasStage;
