import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),

  AUTH_JWT_SECRET: z
    .string()
    .min(32, "AUTH_JWT_SECRET must be at least 32 chars"),
  MONGODB_URI: z.string().url(),
  WEB_ORIGIN: z.string().url(),

  ENABLE_DEMO_LOGIN: z
    .string()
    .optional()
    .transform((v) => v === "true"),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  LIVEBLOCKS_SECRET_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;
