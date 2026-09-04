import { describe, expect, it } from "vitest";
import { initials } from "@/lib/initials";

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Sara Martínez")).toBe("SM");
    expect(initials("J. R. R. Tolkien")).toBe("JR");
  });

  it("treats a hyphenated name as one word", () => {
    expect(initials("Anne-Marie Dupont")).toBe("AD");
    expect(initials("Jean-Pierre Rousseau")).toBe("JR");
  });

  it("copes with a single word and with stray whitespace", () => {
    expect(initials("Sara")).toBe("S");
    expect(initials("  Sara   Martínez  ")).toBe("SM");
  });

  it("returns nothing for a nameless string, leaving the fallback to the caller", () => {
    expect(initials("")).toBe("");
    expect(initials("   ")).toBe("");
  });
});
