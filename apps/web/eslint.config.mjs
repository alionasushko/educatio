import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import base from "../../eslint.base.mjs";

const BOUNDARY_VIOLATIONS = [
  {
    name: "mongoose",
    message: "Mongoose is api-only. Add the endpoint to apps/api.",
  },
  {
    name: "mongodb",
    message: "Mongo client is api-only. Add the endpoint to apps/api.",
  },
  {
    name: "@liveblocks/node",
    message:
      "@liveblocks/node is the server SDK and lives in apps/api. Use @liveblocks/client / @liveblocks/react on the web.",
  },
  {
    name: "@ai-sdk/anthropic",
    message: "AI calls are api-only. Use the api summary endpoint.",
  },
  {
    name: "ai",
    message: "Vercel AI SDK is api-only. Use the api summary endpoint.",
  },
  {
    name: "@vercel/blob",
    message: "Blob uploads are api-only. Use POST /upload on the api.",
  },
  {
    name: "resend",
    message: "Email is api-only. The api sends from /auth/* endpoints.",
  },
  {
    name: "bcrypt",
    message:
      "bcrypt is api-only — hash/verify passwords in apps/api behind /auth endpoints.",
  },
  {
    name: "next-auth",
    message:
      "Auth.js is not used in this project — auth lives in apps/api (Nest).",
  },
  {
    name: "@auth/mongodb-adapter",
    message:
      "Auth.js is not used in this project — auth lives in apps/api (Nest).",
  },
];

const BOUNDARY_PATTERNS = BOUNDARY_VIOLATIONS.flatMap(({ name }) => [
  name,
  `${name}/*`,
]);

export default defineConfig([
  ...base,
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: BOUNDARY_VIOLATIONS,
          patterns: [
            {
              group: BOUNDARY_PATTERNS,
              message:
                "api-only package — add the endpoint to apps/api instead of importing it into the web bundle.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
