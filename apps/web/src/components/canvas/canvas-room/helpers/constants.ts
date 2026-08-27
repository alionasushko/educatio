import type { ParticipantRole } from "@/lib/liveblocks.config";

export const ROLE_CURSOR_COLOR: Record<ParticipantRole, string> = {
  tutor: "--avatar-1",
  student: "--avatar-2",
};
