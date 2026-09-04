// @vitest-environment node

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { studentSessionSchema } from "@educatio/shared/api/sessions";

const read = (path: string): string =>
  readFileSync(join(process.cwd(), path), "utf8");

const JOIN_FORM_DIR = "src/components/lesson/join-lesson-form";

const joinFormSources = (): string =>
  [join(process.cwd(), JOIN_FORM_DIR)]
    .flatMap((dir) => readdirSync(dir, { recursive: true }) as string[])
    .map((entry) => join(process.cwd(), JOIN_FORM_DIR, entry))
    .filter((path) => path.endsWith(".ts") || path.endsWith(".tsx"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");

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
    const form = joinFormSources();
    expect(form).toContain('name="email"');
    expect(form).toContain('type="email"');
    expect(
      studentSessionSchema.safeParse({ inviteCode: "K7VZ9QM2XB", name: "Sam" })
        .success,
    ).toBe(false);
  });

  it.each(DESCRIBES_JOINING)("%s says so too", (path) => {
    const sentences = sentencesMentioningName(read(path));
    expect(sentences.length).toBeGreaterThan(0);
    for (const sentence of sentences) {
      expect(sentence).toMatch(/email/i);
    }
  });
});
