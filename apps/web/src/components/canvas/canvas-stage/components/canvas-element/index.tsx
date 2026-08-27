"use client";

import { useCallback, useEffect, useRef } from "react";
import type Konva from "konva";
import { Group } from "react-konva";
import {
  shallow,
  useHistory,
  useOthersMapped,
  useStorage,
  useUpdateMyPresence,
} from "@liveblocks/react";
import { DRAG_SYNC_MS, MIN_ELEMENT_SIDE } from "../../helpers/constants";
import {
  useMoveElement,
  useTransformElement,
  type Transformed,
} from "../../helpers/use-canvas-mutations";
import TextElement from "./components/text-element";
import StickyElement from "./components/sticky-element";
import ShapeElement from "./components/shape-element";
import PathElement from "./components/path-element";
import ImageElement from "./components/image-element";
import CodeElement from "./components/code-element";
import PeerSelection from "./components/peer-selection";

interface Props {
  id: string;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
}

const CanvasElementNode = ({ id, onSelect, onEdit }: Props) => {
  const element = useStorage((root) => root.elements[id]);
  const peerTransforms = useOthersMapped(
    (other) =>
      other.presence.transforming?.id === id
        ? other.presence.transforming
        : null,
    shallow,
  );
  const live = peerTransforms.find(([, value]) => value !== null)?.[1] ?? null;
  const peerSelections = useOthersMapped(
    (other) =>
      other.presence.selection?.includes(id) ? other.presence.color : null,
    shallow,
  );
  const selectedByPeer =
    peerSelections.find(([, value]) => value !== null)?.[1] ?? null;
  const moveElement = useMoveElement();
  const transformElement = useTransformElement();
  const history = useHistory();
  const updateMyPresence = useUpdateMyPresence();
  const lastSync = useRef(0);
  const lastTransformSync = useRef(0);
  const anchor = useRef<string | null>(null);
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

  const handleTransformStart = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      const transformer = event.target
        .getStage()
        ?.findOne<Konva.Transformer>("Transformer");
      anchor.current = transformer?.getActiveAnchor() ?? null;
      startMerging();
    },
    [startMerging],
  );

  const handleTransform = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      const node = event.target as Konva.Group;
      const sideDrag =
        anchor.current === "middle-left" || anchor.current === "middle-right";
      const textNode =
        element?.type === "text" ? node.findOne<Konva.Text>("Text") : undefined;

      if (sideDrag && textNode) {
        const scaleX = node.scaleX();
        if (scaleX !== 1) {
          textNode.width(Math.max(MIN_ELEMENT_SIDE, textNode.width() * scaleX));
          node.scaleX(1);
          node.scaleY(1);
        }
      }

      const now = performance.now();
      if (now - lastTransformSync.current < DRAG_SYNC_MS) return;
      lastTransformSync.current = now;

      if (sideDrag && textNode) {
        transformElement(id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: 1,
          scaleY: 1,
          width: textNode.width(),
          height: textNode.height(),
        });
        return;
      }

      updateMyPresence({
        transforming: {
          id,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        },
      });
    },
    [id, element, transformElement, updateMyPresence],
  );

  const handleTransformEnd = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      lastTransformSync.current = 0;
      updateMyPresence({ transforming: null });
      const node = event.target as Konva.Group;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      const patch: Transformed = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX,
        scaleY,
      };

      if (element?.type === "text") {
        const textNode = node.findOne<Konva.Text>("Text");
        const sideDrag =
          anchor.current === "middle-left" || anchor.current === "middle-right";
        if (sideDrag && textNode) {
          patch.scaleX = 1;
          patch.scaleY = 1;
          patch.width = textNode.width();
          patch.height = textNode.height();
        } else {
          patch.fontSize = element.fontSize * scaleX;
        }
      }

      transformElement(id, patch);
      stopMerging();
    },
    [id, element, transformElement, stopMerging, updateMyPresence],
  );

  if (!element) return null;

  return (
    <Group
      x={live?.x ?? element.x}
      y={live?.y ?? element.y}
      rotation={live?.rotation ?? element.rotation}
      scaleX={live?.scaleX ?? 1}
      scaleY={live?.scaleY ?? 1}
      draggable
      onClick={handleSelect}
      onTap={handleSelect}
      onDblClick={handleEdit}
      onDblTap={handleEdit}
      id={id}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onTransformStart={handleTransformStart}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
    >
      {element.type === "text" && <TextElement element={element} />}
      {element.type === "sticky" && <StickyElement element={element} />}
      {element.type === "shape" && <ShapeElement element={element} />}
      {element.type === "path" && <PathElement element={element} />}
      {element.type === "image" && <ImageElement element={element} />}
      {element.type === "code" && <CodeElement element={element} />}
      {selectedByPeer && (
        <PeerSelection element={element} color={selectedByPeer} />
      )}
    </Group>
  );
};

export default CanvasElementNode;
