"use client";

import { Line } from "react-konva";
import type { DrawPathElement } from "@educatio/shared";

interface Props {
  element: DrawPathElement;
}

const PathElement = ({ element }: Props) => (
  <Line
    x={element.x}
    y={element.y}
    rotation={element.rotation}
    points={element.points}
    stroke={element.stroke}
    strokeWidth={element.strokeWidth}
    lineCap="round"
    lineJoin="round"
    tension={0.4}
    perfectDrawEnabled={false}
  />
);

export default PathElement;
