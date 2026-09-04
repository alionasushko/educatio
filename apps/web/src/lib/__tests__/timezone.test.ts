// @vitest-environment node

import { describe, expect, it } from "vitest";
import { safeTimeZone } from "../timezone";

describe("safeTimeZone", () => {
  it("accepts a zone the browser can report", () => {
    expect(safeTimeZone("Europe/Kyiv")).toBeDefined();
    expect(safeTimeZone("UTC")).toBe("UTC");
  });

  it("refuses junk, an overlong value and nothing at all", () => {
    expect(safeTimeZone("Mars/Olympus_Mons")).toBeUndefined();
    expect(safeTimeZone("x".repeat(65))).toBeUndefined();
    expect(safeTimeZone("")).toBeUndefined();
    expect(safeTimeZone(undefined)).toBeUndefined();
  });

  it("canonicalises aliases, which is why the cookie is compared raw", () => {
    const reported = "Asia/Kolkata";
    const normalised = safeTimeZone(reported);

    expect(normalised).toBeDefined();
    // TimezoneBootstrap compares the browser's zone against the stored cookie.
    // Handing it the normalised value would never match in an aliased zone, so
    // it would rewrite the cookie and refresh on every page load.
    if (normalised !== reported) {
      expect(safeTimeZone(normalised)).toBe(normalised);
    }
  });

  it("is stable once applied to its own output", () => {
    for (const zone of ["Europe/Kyiv", "America/New_York", "Asia/Kolkata"]) {
      const once = safeTimeZone(zone);
      expect(safeTimeZone(once)).toBe(once);
    }
  });
});
