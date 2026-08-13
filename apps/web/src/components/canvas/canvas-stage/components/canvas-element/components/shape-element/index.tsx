"use client";

import { Arrow, Ellipse, Rect } from "react-konva";
import type { ShapeElement as ShapeElementType } from "@educatio/shared";

interface Props {
  element: ShapeElementType;
}

const ShapeElement = ({ element }: Props) => {
  const common = {
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    fill: element.fill,
  };

  if (element.shape === "circle") {
    return (
      <Ellipse
        {...common}
        x={element.x + element.width / 2}
        y={element.y + element.height / 2}
        radiusX={element.width / 2}
        radiusY={element.height / 2}
      />
    );
  }

  if (element.shape === "arrow") {
    return (
      <Arrow
        {...common}
        points={[0, 0, element.width, element.height]}
        pointerLength={10}
        pointerWidth={10}
        fill={element.stroke}
      />
    );
  }

  return <Rect {...common} width={element.width} height={element.height} />;
};

export default ShapeElement;
