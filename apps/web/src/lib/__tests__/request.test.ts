import { describe, expect, it } from "vitest";
import { safeInternalPath } from "../request";

describe("safeInternalPath", () => {
  it("keeps an allowed internal path with its query", () => {
    expect(safeInternalPath("/dashboard?status=active")).toBe(
      "/dashboard?status=active",
    );
    expect(safeInternalPath("/lesson/abc123")).toBe("/lesson/abc123");
    expect(safeInternalPath("/set-password")).toBe("/set-password");
  });

  it("refuses an absolute url to another origin", () => {
    expect(safeInternalPath("https://evil.example.com/dashboard")).toBeNull();
  });

  it("refuses a protocol-relative url, which a naive slash check would admit", () => {
    expect(safeInternalPath("//evil.example.com/dashboard")).toBeNull();
  });

  it("refuses a path outside the post-login allowlist", () => {
    expect(safeInternalPath("/sign-in")).toBeNull();
    expect(safeInternalPath("/")).toBeNull();
  });

  it("refuses a prefix that only looks allowed", () => {
    expect(safeInternalPath("/dashboardevil")).toBeNull();
  });

  it("refuses missing or non-string input", () => {
    expect(safeInternalPath(null)).toBeNull();
    expect(safeInternalPath(undefined)).toBeNull();
    expect(safeInternalPath("")).toBeNull();
  });
});
