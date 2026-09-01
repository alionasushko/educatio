import type { CanvasElement, ShapeKind, StickyColor } from "@educatio/shared";

const AUTHOR = "demo";
const INK = "--text-primary";
const MUTED = "--text-secondary";
const ACCENT = "--accent-brand";
const RUST = "--accent-rust";
const GREEN = "--avatar-3";

let counter = 0;
let z = 0;

const base = (x: number, y: number) => ({
  id: `seed-${(counter += 1).toString(36)}`,
  x,
  y,
  rotation: 0,
  zIndex: (z += 1),
  createdBy: AUTHOR,
  createdAt: Date.now(),
});

interface TextOptions {
  size?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  width?: number;
}

const text = (
  x: number,
  y: number,
  content: string,
  options: TextOptions = {},
): CanvasElement => ({
  ...base(x, y),
  type: "text",
  width: options.width ?? 420,
  height: (options.size ?? 20) * 1.5,
  content,
  fontSize: options.size ?? 20,
  fontWeight: options.bold ? "bold" : "normal",
  fontStyle: options.italic ? "italic" : "normal",
  color: options.color ?? INK,
});

const title = (x: number, y: number, content: string): CanvasElement =>
  text(x, y, content, { size: 34, bold: true, width: 520 });

const section = (x: number, y: number, content: string): CanvasElement =>
  text(x, y, content, { size: 22, bold: true, color: ACCENT, width: 400 });

const note = (
  x: number,
  y: number,
  content: string,
  color: StickyColor,
): CanvasElement => ({
  ...base(x, y),
  type: "sticky",
  width: 200,
  height: 200,
  content,
  color,
});

const shape = (
  x: number,
  y: number,
  kind: ShapeKind,
  width: number,
  height: number,
  stroke = ACCENT,
): CanvasElement => ({
  ...base(x, y),
  type: "shape",
  shape: kind,
  width,
  height,
  stroke,
  strokeWidth: 3,
});

const draw = (
  x: number,
  y: number,
  points: number[],
  stroke = RUST,
  strokeWidth = 4,
): CanvasElement => ({
  ...base(x, y),
  type: "path",
  points,
  stroke,
  strokeWidth,
});

const underline = (x: number, y: number, width: number, stroke = RUST) =>
  draw(x, y, [0, 0, width * 0.4, -4, width * 0.75, 3, width, -2], stroke, 3);

const tick = (x: number, y: number) =>
  draw(x, y, [0, 10, 8, 22, 26, -6], GREEN, 4);

export interface DemoLessonSeed {
  title: string;
  studentName: string;
  status: "active" | "ended";
  daysAgo: number;
  summary?: string;
  elements: CanvasElement[];
}

const quadratics = (): CanvasElement[] => [
  title(80, 50, "Quadratic equations"),
  text(80, 104, "ax² + bx + c = 0,  where a ≠ 0", {
    size: 22,
    color: MUTED,
    width: 460,
  }),

  section(80, 180, "1 · Factorising"),
  text(80, 224, "x² + 5x + 6 = 0", { size: 22 }),
  text(80, 262, "two numbers: multiply to 6, add to 5", {
    size: 17,
    italic: true,
    color: MUTED,
  }),
  text(110, 296, "→ 2 and 3", { size: 20, color: RUST }),
  text(80, 336, "(x + 2)(x + 3) = 0", { size: 22 }),
  text(80, 376, "x = −2  or  x = −3", { size: 22, bold: true }),
  underline(80, 410, 220),
  tick(320, 372),

  section(560, 180, "2 · Completing the square"),
  text(560, 224, "x² − 4x − 7 = 0", { size: 22 }),
  text(560, 262, "halve the −4, square it → 4", {
    size: 17,
    italic: true,
    color: MUTED,
  }),
  text(560, 296, "(x − 2)² − 4 − 7 = 0", { size: 22 }),
  text(560, 336, "(x − 2)² = 11", { size: 22 }),
  text(560, 376, "x = 2 ± √11", { size: 22, bold: true }),
  shape(548, 366, "rectangle", 230, 52, RUST),

  note(
    980,
    180,
    "Try factorising first.\n\nOnly complete the square when nothing multiplies out cleanly.",
    "yellow",
  ),

  section(80, 500, "3 · The discriminant"),
  text(80, 544, "b² − 4ac", { size: 26, bold: true }),
  shape(60, 534, "circle", 190, 70, GREEN),
  text(80, 610, "> 0   two real roots", { size: 19, color: MUTED }),
  text(80, 646, "= 0   one repeated root", { size: 19, color: MUTED }),
  text(80, 682, "< 0   no real roots", { size: 19, color: MUTED }),
  text(80, 730, "2x² + 3x + 5  →  9 − 40 = −31  →  none", {
    size: 19,
    color: RUST,
    width: 460,
  }),
  draw(300, 540, [0, 40, 60, 20, 130, 8, 200, 6]),

  note(
    980,
    420,
    "Homework\n\n5 × factorising (a = 1)\n3 × where a > 1\n\nCheck the discriminant before solving.",
    "blue",
  ),
];

const sineRule = (): CanvasElement[] => [
  title(80, 50, "The sine rule"),
  text(80, 104, "a / sin A  =  b / sin B  =  c / sin C", {
    size: 22,
    color: MUTED,
    width: 480,
  }),

  section(80, 180, "The triangle"),
  draw(120, 240, [0, 220, 200, 0], INK, 3),
  draw(320, 240, [0, 0, 180, 220], INK, 3),
  draw(120, 460, [0, 0, 380, 0], INK, 3),
  text(96, 462, "B", { size: 20, bold: true, width: 40 }),
  text(310, 212, "A", { size: 20, bold: true, width: 40 }),
  text(500, 462, "C", { size: 20, bold: true, width: 40 }),
  text(200, 330, "c", { size: 19, italic: true, color: ACCENT, width: 40 }),
  text(430, 330, "b", { size: 19, italic: true, color: ACCENT, width: 40 }),
  text(300, 480, "a", { size: 19, italic: true, color: ACCENT, width: 40 }),
  draw(280, 250, [0, 0, 18, 14, 40, 16], RUST, 3),

  section(620, 180, "Worked example"),
  text(620, 224, "a = 8 cm,  A = 40°,  B = 65°", { size: 21 }),
  text(620, 268, "find b", { size: 21, italic: true, color: MUTED }),
  text(620, 316, "b / sin 65°  =  8 / sin 40°", { size: 21 }),
  text(620, 360, "b = 8 · sin 65° / sin 40°", { size: 21 }),
  text(620, 404, "b ≈ 11.3 cm", { size: 22, bold: true }),
  underline(620, 438, 190),

  note(
    620,
    500,
    "Use the sine rule when you know:\n\n• two angles + one side\n• two sides + a non-included angle",
    "purple",
  ),

  note(
    860,
    500,
    "Next time\n\nThe ambiguous case — when two angles fit the same measurements.",
    "green",
  ),

  text(80, 560, "Angles in a triangle add to 180° → C = 75°", {
    size: 19,
    color: RUST,
    width: 480,
  }),
];

export const demoLessonSeeds = (): DemoLessonSeed[] => {
  z = 0;
  return [
    {
      title: "Quadratic equations",
      studentName: "Maya Fernandes",
      status: "ended",
      daysAgo: 6,
      summary: `## Topics covered

- Recognising a quadratic in standard form
- Factorising when the coefficient of x² is 1
- Completing the square, and why it works
- Reading the discriminant

## Key concepts

- **Standard form** — ax² + bx + c = 0, where a ≠ 0.
- **Factorising** — find two numbers that multiply to c and add to b.
- **Completing the square** turns the equation into (x + p)² = q, which can always be solved by taking roots.
- **The discriminant** b² − 4ac tells you how many real roots exist before you solve anything: two if positive, one if zero, none if negative.

## Examples worked through

- x² + 5x + 6 = 0, factorised to (x + 2)(x + 3) = 0 and solved by inspection.
- x² − 4x − 7 = 0, solved by completing the square once factorising failed.
- A discriminant check on 2x² + 3x + 5, showing why it has no real roots at all.

## Suggested next steps

- Practise five factorising problems where a = 1, then three where a > 1.
- Complete the square on x² + 8x + 3 without looking at the worked example.
- Before solving anything next week, predict the number of roots from the discriminant alone.`,
      elements: quadratics(),
    },
    {
      title: "Trigonometry: the sine rule",
      studentName: "Maya Fernandes",
      status: "active",
      daysAgo: 0,
      elements: sineRule(),
    },
  ];
};
