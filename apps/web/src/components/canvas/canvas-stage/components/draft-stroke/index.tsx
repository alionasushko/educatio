"use client";

import { Line } from "react-konva";
import { PEN_STROKE_WIDTH } from "../../helpers/constants";
import { cssToken } from "../../helpers/helpers";

interface Props {
  x: number;
  y: number;
  points: number[];
}

const DraftStroke = ({ x, y, points }: Props) => (
  <Line
    x={x}
    y={y}
    points={points}
    stroke={cssToken("--accent-brand")}
    strokeWidth={PEN_STROKE_WIDTH}
    lineCap="round"
    lineJoin="round"
    tension={0.4}
    listening={false}
    perfectDrawEnabled={false}
  />
);

export default DraftStroke;
