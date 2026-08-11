import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

const sharedSrc = fileURLToPath(
  new URL("../../packages/shared/src", import.meta.url),
);

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts", "test/**/*.spec.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    pool: "forks",
    fileParallelism: false,
  },
  resolve: {
    alias: [
      {
        find: /^@educatio\/shared\/api\/(.*)$/,
        replacement: `${sharedSrc}/api/$1`,
      },
      { find: /^@educatio\/shared$/, replacement: `${sharedSrc}/index.ts` },
    ],
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
});
