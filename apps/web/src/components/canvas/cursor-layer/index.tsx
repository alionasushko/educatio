"use client";

import { shallow, useOthersMapped } from "@liveblocks/react";
import type { Viewport } from "../canvas-stage/helpers/types";
import RemoteCursor from "./components/remote-cursor";

interface Props {
  viewport: Viewport;
}

const CursorLayer = ({ viewport }: Props) => {
  const cursors = useOthersMapped(
    (other) =>
      other.presence.cursor
        ? {
            x: other.presence.cursor.x,
            y: other.presence.cursor.y,
            name: other.presence.name,
            role: other.presence.role,
            color: other.presence.color,
          }
        : null,
    shallow,
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {cursors.map(([connectionId, cursor]) =>
        cursor ? (
          <RemoteCursor
            key={connectionId}
            x={cursor.x * viewport.scale + viewport.x}
            y={cursor.y * viewport.scale + viewport.y}
            name={cursor.name}
            role={cursor.role}
            color={cursor.color}
          />
        ) : null,
      )}
    </div>
  );
};

export default CursorLayer;
