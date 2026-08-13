"use client";

import { useEffect, useState } from "react";
import { Image as KonvaImage, Rect } from "react-konva";
import type { ImageElement as ImageElementType } from "@educatio/shared";
import { cssToken } from "../../../../helpers/helpers";

interface Props {
  element: ImageElementType;
}

const ImageElement = ({ element }: Props) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const node = new window.Image();
    node.crossOrigin = "anonymous";
    node.src = element.src;
    const onLoad = () => setImage(node);
    node.addEventListener("load", onLoad);
    return () => {
      node.removeEventListener("load", onLoad);
      setImage(null);
    };
  }, [element.src]);

  if (!image) {
    return (
      <Rect
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        width={element.width}
        height={element.height}
        fill={cssToken("--surface")}
        stroke={cssToken("--border-subtle")}
        strokeWidth={1}
        cornerRadius={8}
      />
    );
  }

  return (
    <KonvaImage
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      width={element.width}
      height={element.height}
      image={image}
      cornerRadius={8}
    />
  );
};

export default ImageElement;
