import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { MAX_SNAPSHOT_BYTES } from "@educatio/shared/api/snapshot";
import { securityHeaders } from "./src/lib/security-headers";

const headers = securityHeaders(
  process.env.NODE_ENV !== "production",
  process.env.NEXT_PUBLIC_SENTRY_DSN,
);

const nextConfig: NextConfig = {
  headers: async () => [{ source: "/(.*)", headers }],
  experimental: {
    serverActions: { bodySizeLimit: MAX_SNAPSHOT_BYTES },
  },
};

export default withSentryConfig(nextConfig, { silent: true });
