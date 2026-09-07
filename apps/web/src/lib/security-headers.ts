interface Header {
  key: string;
  value: string;
}

const originOf = (dsn: string | undefined): string => {
  if (!dsn) return "";
  try {
    const { protocol, origin } = new URL(dsn);
    return protocol === "https:" ? ` ${origin}` : "";
  } catch {
    return "";
  }
};

export const contentSecurityPolicy = (
  isDev: boolean,
  sentryDsn?: string,
): string =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.public.blob.vercel-storage.com",
    "font-src 'self'",
    `connect-src 'self' https://*.liveblocks.io wss://*.liveblocks.io${isDev ? " ws://localhost:3000" : ""}${originOf(sentryDsn)}`,
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

export const securityHeaders = (
  isDev: boolean,
  sentryDsn?: string,
): Header[] => [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy(isDev, sentryDsn),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];
