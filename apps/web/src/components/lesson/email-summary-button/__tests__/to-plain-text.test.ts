import { describe, expect, it } from "vitest";
import { toPlainText } from "../helpers/helpers";

describe("toPlainText", () => {
  it("drops heading and bold markers, keeping the words", () => {
    expect(toPlainText("### **Topics covered**")).toBe("Topics covered");
    expect(toPlainText("Leveraging **LLMs** to *summarize*")).toBe(
      "Leveraging LLMs to summarize",
    );
  });

  it("turns markdown bullets into readable ones", () => {
    expect(toPlainText("* **Intro:** how data flows\n* Parsing")).toBe(
      "• Intro: how data flows\n• Parsing",
    );
  });

  it("keeps numbered lists as written", () => {
    expect(toPlainText("1. **First**\n2. Second")).toBe("1. First\n2. Second");
  });

  it("unwraps links and inline code", () => {
    expect(toPlainText("See [the docs](https://x.dev) and `parse()`")).toBe(
      "See the docs and parse()",
    );
  });

  it("collapses the blank-line runs markdown leaves behind", () => {
    expect(toPlainText("A\n\n\n\nB")).toBe("A\n\nB");
  });

  it("leaves plain prose untouched", () => {
    expect(toPlainText("It was great connecting today!")).toBe(
      "It was great connecting today!",
    );
  });
});
