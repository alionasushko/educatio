"use client";

import { Line } from "react-konva";
import type { DrawPathElement } from "@educatio/shared";
import { paint } from "../../../../helpers/helpers";

interface Props {
  element: DrawPathElement;
}

const PathElement = ({ element }: Props) => (
  <Line
    points={element.points}
    stroke={paint(element.stroke)}
    strokeWidth={element.strokeWidth}
    lineCap="round"
    lineJoin="round"
    tension={0.4}
    hitStrokeWidth={Math.max(element.strokeWidth, 12)}
    perfectDrawEnabled={false}
  />
);

export default PathElement;
