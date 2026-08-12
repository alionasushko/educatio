import type { ParticipantRole } from "@/lib/liveblocks.config";

export const ROLE_CURSOR_COLOR: Record<ParticipantRole, string> = {
  tutor: "var(--avatar-1)",
  student: "var(--avatar-2)",
};
