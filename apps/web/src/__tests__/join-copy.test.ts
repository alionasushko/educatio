// @vitest-environment node

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string): string =>
  readFileSync(join(process.cwd(), path), "utf8");

const JOIN_FORM = "src/components/lesson/join-lesson-form/index.tsx";

const DESCRIBES_JOINING = [
  "src/components/marketing/faq-section.tsx",
  "src/components/marketing/how-it-works-section.tsx",
  "src/components/lesson/share-lesson-button/index.tsx",
];

const sentencesMentioningName = (source: string): string[] =>
  source
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => /their name/i.test(sentence));

describe("what we tell people a student needs to join", () => {
  it("the join form asks for an email, and requires it", () => {
    const form = read(JOIN_FORM);
    expect(form).toContain('name="email"');
    expect(form).toContain('type="email"');
    expect(form).toContain("Enter a valid email address.");
  });

  it.each(DESCRIBES_JOINING)("%s says so too", (path) => {
    const sentences = sentencesMentioningName(read(path));
    expect(sentences.length).toBeGreaterThan(0);
    for (const sentence of sentences) {
      expect(sentence).toMatch(/email/i);
    }
  });
});
