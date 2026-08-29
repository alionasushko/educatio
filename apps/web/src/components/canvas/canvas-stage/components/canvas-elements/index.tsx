"use client";

import { memo } from "react";
import { shallow, useStorage } from "@liveblocks/react";
import CanvasElementNode from "../canvas-element";

interface Props {
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  canEdit: boolean;
}

const CanvasElements = ({ onSelect, onEdit, canEdit }: Props) => {
  const ids = useStorage(
    (root) =>
      Object.values(root.elements)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((element) => element.id),
    shallow,
  );

  if (!ids) return null;

  return ids.map((id) => (
    <CanvasElementNode
      key={id}
      id={id}
      onSelect={onSelect}
      onEdit={onEdit}
      canEdit={canEdit}
    />
  ));
};

export default memo(CanvasElements);
