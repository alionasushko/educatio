"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import type Konva from "konva";
import { Layer, Stage } from "react-konva";
import {
  useRedo,
  useStorageRoot,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react";
import { ALLOWED_UPLOAD_TYPES } from "@educatio/shared/api/upload";
import type { CanvasSettings } from "../helpers/types";
import { GRID_SIZE } from "./helpers/constants";
import { useStageSize } from "./helpers/use-stage-size";
import { useViewport } from "./helpers/use-viewport";
import { useCanvasShortcuts } from "./helpers/use-canvas-shortcuts";
import {
  useCreateElement,
  useCreateImage,
  useCreatePath,
  useDeleteElement,
} from "./helpers/use-canvas-mutations";
import { usePen } from "./helpers/use-pen";
import { useImageUpload } from "./helpers/use-image-upload";
import { isCreatable, toCanvasPoint } from "./helpers/helpers";
import CanvasElements from "./components/canvas-elements";
import DraftStroke from "./components/draft-stroke";
import DropOverlay from "./components/drop-overlay";
import PeerDrafts from "./components/peer-drafts";
import CursorLayer from "../cursor-layer";
import SelectionOverlay from "./components/selection-overlay";
import TextEditor from "./components/text-editor";

interface Props {
  settings: CanvasSettings;
  onChange: (patch: Partial<CanvasSettings>) => void;
}

const CanvasStage = ({ settings, onChange }: Props) => {
  const { tool } = settings;
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useStageSize(containerRef);
  const { viewport, panning, spaceHeld, handlers } = useViewport(containerRef);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropPoint = useRef<{ x: number; y: number } | null>(null);

  const [storageRoot] = useStorageRoot();
  const storageReady = storageRoot !== null;

  const updateMyPresence = useUpdateMyPresence();
  const createElement = useCreateElement();
  const createPath = useCreatePath();
  const createImage = useCreateImage();
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

  const placeImage = useCallback(
    ({
      src,
      x,
      y,
      width,
      height,
    }: {
      src: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }) => createImage(src, x, y, width, height),
    [createImage],
  );

  const { uploading, upload } = useImageUpload(placeImage);

  const pickImage = useCallback((x: number, y: number) => {
    dropPoint.current = { x, y };
    fileInputRef.current?.click();
  }, []);

  const handleFileChosen = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      const point = dropPoint.current;
      event.target.value = "";
      if (!file || !point) return;
      void upload(file, point.x, point.y);
    },
    [upload],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!storageReady || !event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      setDragging(true);
    },
    [storageReady],
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null))
      return;
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (!storageReady) return;
      const file = event.dataTransfer.files[0];
      if (!file) return;
      const point = toCanvasPoint(
        containerRef.current,
        viewport,
        event.clientX,
        event.clientY,
      );
      if (!point) return;
      void upload(file, point.x, point.y);
    },
    [storageReady, upload, viewport],
  );

  const handleStageClick = useCallback(
    (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = event.target.getStage();
      if (event.target !== stage) return;

      setEditingId(null);

      if (tool === "image") {
        const spot = stage?.getRelativePointerPosition();
        if (storageReady && spot) pickImage(spot.x, spot.y);
        return;
      }

      if (!isCreatable(tool)) {
        select(null);
        return;
      }

      if (!storageReady) return;

      const point = stage?.getRelativePointerPosition();
      if (!point) return;

      const id = createElement(tool, point.x, point.y, settings);
      select(id);
      setEditingId(id);
      onChange({ tool: "select" });
    },
    [tool, settings, storageReady, createElement, select, onChange, pickImage],
  );

  const handleDelete = useCallback(() => {
    if (!selectedId || editingId) return;
    deleteElement(selectedId);
    select(null);
  }, [selectedId, editingId, deleteElement, select]);

  const commitStroke = useCallback(
    (x: number, y: number, points: number[]) =>
      createPath(x, y, points, settings.inkToken, settings.strokeWidth),
    [createPath, settings.inkToken, settings.strokeWidth],
  );

  const pen = usePen({
    containerRef,
    viewport,
    tool,
    enabled: storageReady && !spaceHeld,
    stroke: settings.inkToken,
    strokeWidth: settings.strokeWidth,
    onCommit: commitStroke,
  });

  const pointerHandlers = {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      handlers.onPointerDown(event);
      pen.handlers.onPointerDown(event);
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      handlers.onPointerMove(event);
      pen.handlers.onPointerMove(event);
      const at = toCanvasPoint(
        containerRef.current,
        viewport,
        event.clientX,
        event.clientY,
      );
      if (at) updateMyPresence({ cursor: at });
    },
    onPointerLeave: () => updateMyPresence({ cursor: null }),
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
    onTool: (next) => onChange({ tool: next }),
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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
            <PeerDrafts />
            {pen.draft && (
              <DraftStroke
                x={pen.draft.x}
                y={pen.draft.y}
                points={pen.draft.points}
                stroke={settings.inkToken}
                strokeWidth={settings.strokeWidth}
              />
            )}
          </Layer>
        </Stage>
      )}

      <CursorLayer viewport={viewport} />

      {dragging && <DropOverlay />}

      {uploading && (
        <div
          role="status"
          className="border-border-subtle bg-surface text-text-secondary absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full border px-3 py-1.5 text-xs shadow-(--shadow-medium)"
        >
          Adding image…
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_UPLOAD_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChosen}
      />

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
