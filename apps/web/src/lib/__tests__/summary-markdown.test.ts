import { describe, expect, it } from "vitest";
import { parseSummaryBlocks, splitBold } from "../summary-markdown";

describe("splitBold", () => {
  it("separates the bold runs from the plain ones", () => {
    expect(splitBold("Leveraging **LLMs** to summarize")).toEqual([
      { text: "Leveraging ", bold: false },
      { text: "LLMs", bold: true },
      { text: " to summarize", bold: false },
    ]);
  });

  it("drops leftover emphasis and code markers", () => {
    expect(splitBold("*italic* and `code`")).toEqual([
      { text: "italic and code", bold: false },
    ]);
  });
});

describe("parseSummaryBlocks", () => {
  it("recognises the shapes the summary prompt asks for", () => {
    const blocks = parseSummaryBlocks(
      [
        "### **Topics covered**",
        "* **Intro:** how data flows",
        "1. **First** concept",
        "A closing paragraph.",
      ].join("\n"),
    );

    expect(blocks.map((block) => block.kind)).toEqual([
      "heading",
      "bullet",
      "numbered",
      "paragraph",
    ]);
  });

  it("keeps the number as its own marker", () => {
    const [block] = parseSummaryBlocks("2. Second thing");
    expect(block).toMatchObject({ kind: "numbered", marker: "2." });
    expect(block?.segments[0]?.text).toBe("Second thing");
  });

  it("carries bold through into the block's segments", () => {
    const [block] = parseSummaryBlocks("* **Intro:** how data flows");
    expect(block?.segments).toEqual([
      { text: "Intro:", bold: true },
      { text: " how data flows", bold: false },
    ]);
  });

  it("ignores blank lines rather than emitting empty blocks", () => {
    expect(parseSummaryBlocks("One\n\n\nTwo")).toHaveLength(2);
    expect(parseSummaryBlocks("   \n\n")).toHaveLength(0);
  });
});
