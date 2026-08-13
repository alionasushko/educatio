"use client";

import { shallow, useStorage } from "@liveblocks/react";
import CanvasElementNode from "../canvas-element";

const CanvasElements = () => {
  const ids = useStorage(
    (root) =>
      Object.values(root.elements)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((element) => element.id),
    shallow,
  );

  if (!ids) return null;

  return ids.map((id) => <CanvasElementNode key={id} id={id} />);
};

export default CanvasElements;
