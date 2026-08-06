import { z } from "zod";

export const LIVEBLOCKS_AUTH_PATH = "/liveblocks/auth";

export const liveblocksAuthSchema = z.object({
  room: z.string().min(1),
});
export type LiveblocksAuthInput = z.infer<typeof liveblocksAuthSchema>;

export const liveblocksAuthResponseSchema = z.looseObject({
  token: z.string(),
});
export type LiveblocksAuthResponse = z.infer<
  typeof liveblocksAuthResponseSchema
>;
