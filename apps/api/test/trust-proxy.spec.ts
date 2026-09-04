import { describe, expect, it } from "vitest";
import { envSchema } from "../src/config/env.schema";

const base = {
  NODE_ENV: "test",
  AUTH_JWT_SECRET: "a-secret-that-is-at-least-32-characters",
  MONGODB_URI: "mongodb://localhost:27017/educatio",
  WEB_ORIGIN: "http://localhost:3000",
};

const parse = (trustProxy?: string) =>
  envSchema.safeParse(
    trustProxy === undefined ? base : { ...base, TRUST_PROXY: trustProxy },
  );

describe("which proxies the api will believe", () => {
  it("refuses a hop count", () => {
    for (const hops of ["1", "0", "2", " 3 "]) {
      const result = parse(hops);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/hop count/i);
      }
    }
  });

  it("names the proxies instead, and defaults to doing so", () => {
    expect(parse("loopback")).toMatchObject({ success: true });
    expect(parse("10.0.0.0/8, 127.0.0.1")).toMatchObject({ success: true });
    expect(parse("true")).toMatchObject({ success: true });
    expect(parse("false")).toMatchObject({ success: true });

    const fallback = parse();
    expect(fallback.success).toBe(true);
    if (fallback.success) {
      expect(fallback.data.TRUST_PROXY).toBe("loopback, uniquelocal");
    }
  });
});
