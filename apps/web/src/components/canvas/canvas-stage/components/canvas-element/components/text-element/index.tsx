"use client";

import { Text } from "react-konva";
import type { TextElement as TextElementType } from "@educatio/shared";
import { CANVAS_FONT } from "../../../../helpers/constants";

interface Props {
  element: TextElementType;
}

const TextElement = ({ element }: Props) => (
  <Text
    x={element.x}
    y={element.y}
    rotation={element.rotation}
    width={element.width}
    height={element.height}
    text={element.content}
    fontSize={element.fontSize}
    fontFamily={CANVAS_FONT}
    fontStyle={
      [
        element.fontWeight === "bold" ? "bold" : "",
        element.fontStyle === "italic" ? "italic" : "",
      ]
        .filter(Boolean)
        .join(" ") || "normal"
    }
    fill={element.color}
    lineHeight={1.35}
    listening={false}
  />
);

export default TextElement;
