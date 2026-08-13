import { describe, expect, it } from "vitest";
import { dashboardHref, lessonHref, signInRoute } from "../routes";

describe("lessonHref", () => {
  it("sends an ended lesson to its summary", () => {
    expect(lessonHref({ id: "abc", status: "ended" })).toBe(
      "/lesson/abc/summary",
    );
  });

  it("sends a live lesson to its canvas", () => {
    expect(lessonHref({ id: "abc", status: "active" })).toBe("/lesson/abc");
    expect(lessonHref({ id: "abc", status: "scheduled" })).toBe("/lesson/abc");
  });
});

describe("dashboardHref", () => {
  it("omits defaults so the bare url stays clean", () => {
    expect(dashboardHref({})).toBe("/dashboard");
    expect(dashboardHref({ status: "all", page: 1 })).toBe("/dashboard");
  });

  it("keeps the filters that differ from the default", () => {
    expect(dashboardHref({ status: "active" })).toBe(
      "/dashboard?status=active",
    );
    expect(dashboardHref({ page: 3 })).toBe("/dashboard?page=3");
  });

  it("encodes a search term rather than injecting it", () => {
    expect(dashboardHref({ q: "a&b=c" })).toBe("/dashboard?q=a%26b%3Dc");
  });
});

describe("signInRoute", () => {
  it("round-trips a callback url through encoding", () => {
    const href = signInRoute("/lesson/abc?x=1");
    expect(href).toBe("/sign-in?callbackUrl=%2Flesson%2Fabc%3Fx%3D1");
    expect(
      new URL(href, "https://x.invalid").searchParams.get("callbackUrl"),
    ).toBe("/lesson/abc?x=1");
  });

  it("stays bare without a callback", () => {
    expect(signInRoute()).toBe("/sign-in");
  });
});
