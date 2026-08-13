"use client";

import { useStorage } from "@liveblocks/react";
import TextElement from "./components/text-element";
import StickyElement from "./components/sticky-element";
import ShapeElement from "./components/shape-element";
import PathElement from "./components/path-element";
import ImageElement from "./components/image-element";
import CodeElement from "./components/code-element";

interface Props {
  id: string;
}

const CanvasElementNode = ({ id }: Props) => {
  const element = useStorage((root) => root.elements[id]);

  if (!element) return null;

  switch (element.type) {
    case "text":
      return <TextElement element={element} />;
    case "sticky":
      return <StickyElement element={element} />;
    case "shape":
      return <ShapeElement element={element} />;
    case "path":
      return <PathElement element={element} />;
    case "image":
      return <ImageElement element={element} />;
    case "code":
      return <CodeElement element={element} />;
  }
};

export default CanvasElementNode;
