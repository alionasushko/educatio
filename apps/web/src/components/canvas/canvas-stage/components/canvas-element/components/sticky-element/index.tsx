"use client";

import { Group, Rect, Text } from "react-konva";
import type { StickyNoteElement } from "@educatio/shared";
import {
  CANVAS_FONT,
  STICKY_PADDING,
  STICKY_TOKEN,
} from "../../../../helpers/constants";
import { cssToken } from "../../../../helpers/helpers";

interface Props {
  element: StickyNoteElement;
}

const StickyElement = ({ element }: Props) => (
  <Group x={element.x} y={element.y} rotation={element.rotation}>
    <Rect
      width={element.width}
      height={element.height}
      fill={cssToken(STICKY_TOKEN[element.color])}
      cornerRadius={4}
      shadowColor="rgba(28, 25, 23, 0.18)"
      shadowBlur={10}
      shadowOffsetY={2}
      shadowOpacity={1}
    />
    <Text
      x={STICKY_PADDING}
      y={STICKY_PADDING}
      width={element.width - STICKY_PADDING * 2}
      height={element.height - STICKY_PADDING * 2}
      text={element.content}
      fontSize={15}
      fontFamily={CANVAS_FONT}
      fill={cssToken("--text-primary")}
      lineHeight={1.35}
    />
  </Group>
);

export default StickyElement;
