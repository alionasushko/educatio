import { beforeEach, describe, expect, it } from "vitest";
import { paint } from "../helpers";

const setToken = (name: string, value: string) => {
  document.documentElement.style.setProperty(name, value);
};

describe("paint", () => {
  beforeEach(() => {
    setToken("--text-primary", "#1c1917");
    setToken("--accent-rust", "#c2410c");
  });

  it("resolves a design token to whatever the theme currently says", () => {
    expect(paint("--accent-rust")).toBe("#c2410c");
  });

  it("resolves a token once per page load, not per render", () => {
    expect(paint("--text-primary")).toBe("#1c1917");
    setToken("--text-primary", "#fafafa");

    // Deliberate: getComputedStyle forces a style recalc and paint() runs for
    // every element on every render, so the lookup is memoised. Elements follow
    // a palette change on the next load — a live theme toggle would not repaint
    // them, which is fine while dark mode is out of scope.
    expect(paint("--text-primary")).toBe("#1c1917");
  });

  it("passes a literal colour straight through", () => {
    expect(paint("#4338ca")).toBe("#4338ca");
    expect(paint("rgba(67,56,202,0.06)")).toBe("rgba(67,56,202,0.06)");
  });

  it("falls back to ink rather than handing the canvas an empty colour", () => {
    expect(paint("--not-a-real-token")).toBe("#1c1917");
  });
});
