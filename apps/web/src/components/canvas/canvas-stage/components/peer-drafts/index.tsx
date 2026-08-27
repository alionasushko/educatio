"use client";

import { shallow, useOthersMapped } from "@liveblocks/react";
import DraftStroke from "../draft-stroke";

const PeerDrafts = () => {
  const drafts = useOthersMapped((other) => other.presence.draft, shallow);

  return (
    <>
      {drafts.map(([connectionId, draft]) =>
        draft ? (
          <DraftStroke
            key={connectionId}
            x={draft.x}
            y={draft.y}
            points={draft.points}
            stroke={draft.stroke}
            strokeWidth={draft.strokeWidth}
          />
        ) : null,
      )}
    </>
  );
};

export default PeerDrafts;
