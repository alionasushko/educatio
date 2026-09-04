// @vitest-environment node

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

const AA_SMALL_TEXT = 4.5;

const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const luminance = (hex: string): number => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!);
};

const contrast = (a: string, b: string): number => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter! + 0.05) / (darker! + 0.05);
};

const declarations = (token: string): string[] => {
  const found = [
    ...css.matchAll(new RegExp(`--${token}:\\s*(#[0-9a-f]{6})`, "gi")),
  ];
  return found.map((m) => m[1]!.toLowerCase());
};

// Light block is declared first, dark second — see globals.css :root and .dark.
const themes = ["light", "dark"] as const;

describe("text tokens against the surfaces they are read on", () => {
  it("declares one value per theme for each token", () => {
    for (const token of ["bg", "surface", "text-secondary", "text-tertiary"]) {
      expect(declarations(token), token).toHaveLength(themes.length);
    }
  });

  it("meets AA for small text on both the page and a card", () => {
    const backgrounds = [declarations("bg"), declarations("surface")];

    for (const token of ["text-primary", "text-secondary", "text-tertiary"]) {
      const values = declarations(token);
      themes.forEach((theme, index) => {
        for (const surfaces of backgrounds) {
          const ratio = contrast(values[index]!, surfaces[index]!);
          expect(
            ratio,
            `${theme} --${token} ${values[index]} on ${surfaces[index]}`,
          ).toBeGreaterThanOrEqual(AA_SMALL_TEXT);
        }
      });
    }
  });

  it("keeps tertiary dimmer than secondary, so the ramp still reads as a ramp", () => {
    const secondary = declarations("text-secondary");
    const tertiary = declarations("text-tertiary");
    const bg = declarations("bg");

    themes.forEach((theme, index) => {
      expect(
        contrast(tertiary[index]!, bg[index]!),
        `${theme} tertiary should be lower contrast than secondary`,
      ).toBeLessThan(contrast(secondary[index]!, bg[index]!));
    });
  });
});
