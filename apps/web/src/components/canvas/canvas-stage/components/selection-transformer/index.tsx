"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type Konva from "konva";
import { Transformer } from "react-konva";
import { useStorage } from "@liveblocks/react";
import { MIN_ELEMENT_SIDE } from "../../helpers/constants";
import { cssToken } from "../../helpers/helpers";

interface Props {
  selectedId: string | null;
  scale: number;
}

const SelectionTransformer = ({ selectedId, scale }: Props) => {
  const ref = useRef<Konva.Transformer>(null);
  const element = useStorage((root) =>
    selectedId ? root.elements[selectedId] : null,
  );

  useLayoutEffect(() => {
    // Konva caches the attached node's rect, so a size written to storage
    // leaves the handles around the old box until the cache is dropped.
    ref.current?.forceUpdate();
  }, [element]);

  useEffect(() => {
    const transformer = ref.current;
    if (!transformer) return;
    const stage = transformer.getStage();
    const node = selectedId
      ? stage?.findOne((item: Konva.Node) => item.id() === selectedId)
      : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId]);

  const isText = element?.type === "text";

  return (
    <Transformer
      ref={ref}
      keepRatio={isText}
      enabledAnchors={
        isText
          ? [
              "middle-left",
              "middle-right",
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
            ]
          : undefined
      }
      rotationSnaps={[0, 90, 180, 270]}
      rotationSnapTolerance={6}
      anchorSize={8 / scale}
      anchorCornerRadius={2 / scale}
      anchorStroke={cssToken("--accent-brand")}
      anchorFill={cssToken("--surface")}
      borderStroke={cssToken("--accent-brand")}
      borderStrokeWidth={1.5 / scale}
      borderDash={[6 / scale, 4 / scale]}
      ignoreStroke
      boundBoxFunc={(oldBox, newBox) =>
        Math.abs(newBox.width) < MIN_ELEMENT_SIDE ||
        Math.abs(newBox.height) < MIN_ELEMENT_SIDE
          ? oldBox
          : newBox
      }
    />
  );
};

export default SelectionTransformer;
