import { z } from "zod";

export const studentSessionSchema = z.object({
  inviteCode: z.string().min(1),
  name: z.string().min(1).max(120),
});
export type StudentSessionInput = z.infer<typeof studentSessionSchema>;
