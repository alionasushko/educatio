"use client";

import { Line } from "react-konva";
import { paint } from "../../helpers/helpers";
interface Props {
  x: number;
  y: number;
  points: number[];
  stroke: string;
  strokeWidth: number;
}

const DraftStroke = ({ x, y, points, stroke, strokeWidth }: Props) => (
  <Line
    x={x}
    y={y}
    points={points}
    stroke={paint(stroke)}
    strokeWidth={strokeWidth}
    lineCap="round"
    lineJoin="round"
    tension={0.4}
    listening={false}
    perfectDrawEnabled={false}
  />
);

export default DraftStroke;
