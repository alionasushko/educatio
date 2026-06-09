import { z } from "zod";

export const liveblocksAuthSchema = z.object({
  room: z.string().min(1),
});
export type LiveblocksAuthInput = z.infer<typeof liveblocksAuthSchema>;
