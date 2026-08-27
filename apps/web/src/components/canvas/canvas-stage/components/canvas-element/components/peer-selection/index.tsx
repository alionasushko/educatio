"use client";

import { Rect } from "react-konva";
import type { CanvasElement } from "@educatio/shared";
import { SELECTION_PADDING } from "../../../../helpers/constants";
import { localBounds } from "../../../../helpers/bounds";
import { paint } from "../../../../helpers/helpers";

interface Props {
  element: CanvasElement;
  color: string;
}

const PeerSelection = ({ element, color }: Props) => {
  const bounds = localBounds(element);

  return (
    <Rect
      x={bounds.x - SELECTION_PADDING}
      y={bounds.y - SELECTION_PADDING}
      width={bounds.width + SELECTION_PADDING * 2}
      height={bounds.height + SELECTION_PADDING * 2}
      stroke={paint(color)}
      strokeWidth={1.5}
      dash={[6, 4]}
      cornerRadius={4}
      listening={false}
      perfectDrawEnabled={false}
    />
  );
};

export default PeerSelection;
