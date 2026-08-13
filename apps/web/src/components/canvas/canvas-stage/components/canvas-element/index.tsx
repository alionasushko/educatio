"use client";

import { useCallback, useEffect, useRef } from "react";
import type Konva from "konva";
import { Group } from "react-konva";
import { useHistory, useStorage } from "@liveblocks/react";
import { DRAG_SYNC_MS } from "../../helpers/constants";
import { useMoveElement } from "../../helpers/use-canvas-mutations";
import TextElement from "./components/text-element";
import StickyElement from "./components/sticky-element";
import ShapeElement from "./components/shape-element";
import PathElement from "./components/path-element";
import ImageElement from "./components/image-element";
import CodeElement from "./components/code-element";

interface Props {
  id: string;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
}

const CanvasElementNode = ({ id, onSelect, onEdit }: Props) => {
  const element = useStorage((root) => root.elements[id]);
  const moveElement = useMoveElement();
  const history = useHistory();
  const lastSync = useRef(0);
  const merging = useRef(false);

  const startMerging = useCallback(() => {
    if (merging.current) return;
    merging.current = true;
    history.pause();
  }, [history]);

  const stopMerging = useCallback(() => {
    if (!merging.current) return;
    merging.current = false;
    history.resume();
  }, [history]);

  useEffect(() => stopMerging, [stopMerging]);

  const handleDragMove = useCallback(
    (event: Konva.KonvaEventObject<DragEvent>) => {
      const now = performance.now();
      if (now - lastSync.current < DRAG_SYNC_MS) return;
      lastSync.current = now;
      moveElement(id, event.target.x(), event.target.y());
    },
    [id, moveElement],
  );

  const handleDragEnd = useCallback(
    (event: Konva.KonvaEventObject<DragEvent>) => {
      lastSync.current = 0;
      moveElement(id, event.target.x(), event.target.y());
      stopMerging();
    },
    [id, moveElement, stopMerging],
  );

  const handleSelect = useCallback(() => onSelect(id), [id, onSelect]);

  const handleDragStart = useCallback(() => {
    onSelect(id);
    startMerging();
  }, [id, onSelect, startMerging]);

  const handleEdit = useCallback(() => onEdit(id), [id, onEdit]);

  if (!element) return null;

  return (
    <Group
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable
      onClick={handleSelect}
      onTap={handleSelect}
      onDblClick={handleEdit}
      onDblTap={handleEdit}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      {element.type === "text" && <TextElement element={element} />}
      {element.type === "sticky" && <StickyElement element={element} />}
      {element.type === "shape" && <ShapeElement element={element} />}
      {element.type === "path" && <PathElement element={element} />}
      {element.type === "image" && <ImageElement element={element} />}
      {element.type === "code" && <CodeElement element={element} />}
    </Group>
  );
};

export default CanvasElementNode;
