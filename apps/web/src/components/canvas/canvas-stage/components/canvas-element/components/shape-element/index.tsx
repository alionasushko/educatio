"use client";

import { Arrow, Ellipse, Rect } from "react-konva";
import type { ShapeElement as ShapeElementType } from "@educatio/shared";

interface Props {
  element: ShapeElementType;
}

const ShapeElement = ({ element }: Props) => {
  if (element.shape === "circle") {
    return (
      <Ellipse
        x={element.width / 2}
        y={element.height / 2}
        radiusX={element.width / 2}
        radiusY={element.height / 2}
        stroke={element.stroke}
        strokeWidth={element.strokeWidth}
        fill={element.fill}
      />
    );
  }

  if (element.shape === "arrow") {
    return (
      <Arrow
        points={[0, 0, element.width, element.height]}
        stroke={element.stroke}
        strokeWidth={element.strokeWidth}
        fill={element.stroke}
        pointerLength={10}
        pointerWidth={10}
      />
    );
  }

  return (
    <Rect
      width={element.width}
      height={element.height}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      fill={element.fill}
    />
  );
};

export default ShapeElement;
