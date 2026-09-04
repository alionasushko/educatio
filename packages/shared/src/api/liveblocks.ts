import { z } from "zod";

export const ROOM_ID_MAX = 64;

export const LIVEBLOCKS_SEGMENT = "liveblocks";
export const LIVEBLOCKS_AUTH_SEGMENT = "auth";
export const LIVEBLOCKS_AUTH_PATH = `/${LIVEBLOCKS_SEGMENT}/${LIVEBLOCKS_AUTH_SEGMENT}`;

export const liveblocksAuthSchema = z.object({
  room: z.string().min(1).max(ROOM_ID_MAX),
});
export type LiveblocksAuthInput = z.infer<typeof liveblocksAuthSchema>;

export const liveblocksAuthResponseSchema = z.looseObject({
  token: z.string(),
});
export type LiveblocksAuthResponse = z.infer<
  typeof liveblocksAuthResponseSchema
>;
