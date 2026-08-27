"use client";

import { useOthers } from "@liveblocks/react";
import type { Viewport } from "../canvas-stage/helpers/types";
import RemoteCursor from "./components/remote-cursor";

interface Props {
  viewport: Viewport;
}

const CursorLayer = ({ viewport }: Props) => {
  const others = useOthers();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {others.map(({ connectionId, presence }) =>
        presence.cursor ? (
          <RemoteCursor
            key={connectionId}
            x={presence.cursor.x * viewport.scale + viewport.x}
            y={presence.cursor.y * viewport.scale + viewport.y}
            name={presence.name}
            role={presence.role}
            color={presence.color}
          />
        ) : null,
      )}
    </div>
  );
};

export default CursorLayer;
