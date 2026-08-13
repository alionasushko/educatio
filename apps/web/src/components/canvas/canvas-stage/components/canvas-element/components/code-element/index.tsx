"use client";

import { Group, Rect, Text } from "react-konva";
import type { CodeBlockElement } from "@educatio/shared";
import { CANVAS_MONO_FONT, CODE_PADDING } from "../../../../helpers/constants";
import { cssToken } from "../../../../helpers/helpers";

interface Props {
  element: CodeBlockElement;
}

const CodeElement = ({ element }: Props) => (
  <Group x={element.x} y={element.y} rotation={element.rotation}>
    <Rect
      width={element.width}
      height={element.height}
      fill={cssToken("--surface")}
      stroke={cssToken("--border-medium")}
      strokeWidth={1}
      cornerRadius={8}
    />
    <Text
      x={CODE_PADDING}
      y={CODE_PADDING}
      width={element.width - CODE_PADDING * 2}
      height={element.height - CODE_PADDING * 2}
      text={element.content}
      fontSize={13}
      fontFamily={CANVAS_MONO_FONT}
      fill={cssToken("--text-primary")}
      lineHeight={1.5}
    />
  </Group>
);

export default CodeElement;
