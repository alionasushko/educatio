"use client";

import type { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import type { LatestSnapshotResponse } from "@educatio/shared/api/snapshot";
import { LIVEBLOCKS_AUTH_ROUTE } from "@/lib/routes";
import type { ParticipantRole } from "@/lib/liveblocks.config";
import { ROLE_CURSOR_COLOR } from "./helpers/constants";
import { buildInitialStorage } from "./helpers/helpers";

interface Props {
  roomId: string;
  name: string;
  role: ParticipantRole;
  snapshot: LatestSnapshotResponse["snapshot"];
  children: ReactNode;
}

const CanvasRoom = ({ roomId, name, role, snapshot, children }: Props) => (
  <LiveblocksProvider authEndpoint={LIVEBLOCKS_AUTH_ROUTE}>
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        name,
        role,
        color: ROLE_CURSOR_COLOR[role],
        selection: null,
        tool: "select",
      }}
      initialStorage={() => buildInitialStorage(snapshot)}
    >
      {children}
    </RoomProvider>
  </LiveblocksProvider>
);

export default CanvasRoom;
