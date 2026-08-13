"use client";

import { Group, Rect } from "react-konva";
import { useStorage } from "@liveblocks/react";
import { SELECTION_PADDING } from "../../helpers/constants";
import { localBounds } from "../../helpers/bounds";
import { cssToken } from "../../helpers/helpers";

interface Props {
  selectedId: string | null;
  scale: number;
}

const SelectionOverlay = ({ selectedId, scale }: Props) => {
  const element = useStorage((root) =>
    selectedId ? root.elements[selectedId] : null,
  );

  if (!element) return null;

  const bounds = localBounds(element);

  return (
    <Group
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      listening={false}
    >
      <Rect
        x={bounds.x - SELECTION_PADDING}
        y={bounds.y - SELECTION_PADDING}
        width={bounds.width + SELECTION_PADDING * 2}
        height={bounds.height + SELECTION_PADDING * 2}
        stroke={cssToken("--accent-brand")}
        strokeWidth={1.5 / scale}
        dash={[6 / scale, 4 / scale]}
        cornerRadius={4 / scale}
      />
    </Group>
  );
};

export default SelectionOverlay;
