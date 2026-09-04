import { z } from "zod";

export const TRUSTED_PROXIES = "loopback, uniquelocal";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive().default(3001),

  AUTH_JWT_SECRET: z
    .string()
    .min(32, "AUTH_JWT_SECRET must be at least 32 chars"),
  MONGODB_URI: z.string().url(),
  WEB_ORIGIN: z.string().url(),

  TRUST_PROXY: z
    .string()
    .default(TRUSTED_PROXIES)
    .refine((v) => !/^\d+$/.test(v.trim()), {
      message:
        "TRUST_PROXY must name the proxies to trust (an IP/CIDR list, or true/false) — a hop count is spoofable, see CVE-2026-16732",
    }),

  ENABLE_DEMO_LOGIN: z
    .string()
    .optional()
    .transform((v) => v === "true"),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  LIVEBLOCKS_SECRET_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;
