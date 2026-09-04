import { z } from "zod";
import type { CanvasElement } from "../canvas";

export const MAX_ELEMENT_ID = 64;
export const MAX_ELEMENT_AUTHOR = 128;
export const MAX_ELEMENT_COORD = 10_000_000;
export const MAX_ELEMENT_SIDE = 1_000_000;
export const MAX_ELEMENT_ROTATION = 36_000;
export const MAX_ELEMENT_Z_INDEX = 1_000_000;
export const MAX_ELEMENT_CREATED_AT = 1e15;
export const MAX_ELEMENT_FONT_SIZE = 4_000;
export const MAX_ELEMENT_STROKE_WIDTH = 200;
export const MAX_ELEMENT_CONTENT = 20_000;
export const MAX_ELEMENT_PATH_POINTS = 50_000;
export const MAX_ELEMENT_SRC = 2_048;

export const CANVAS_COLOR_PATTERN =
  /^(?:--[a-z0-9-]{1,48}|#[0-9a-f]{3,8}|[a-z]{1,24})$/i;

const colorSchema = z
  .string()
  .regex(CANVAS_COLOR_PATTERN, "Not a canvas colour token.");

const coordSchema = z.number().min(-MAX_ELEMENT_COORD).max(MAX_ELEMENT_COORD);
const sideSchema = z.number().min(0).max(MAX_ELEMENT_SIDE);
const contentSchema = z.string().max(MAX_ELEMENT_CONTENT);

const baseShape = {
  id: z.string().min(1).max(MAX_ELEMENT_ID),
  x: coordSchema,
  y: coordSchema,
  rotation: z.number().min(-MAX_ELEMENT_ROTATION).max(MAX_ELEMENT_ROTATION),
  zIndex: z.number().min(-MAX_ELEMENT_Z_INDEX).max(MAX_ELEMENT_Z_INDEX),
  createdBy: z.string().min(1).max(MAX_ELEMENT_AUTHOR),
  createdAt: z.number().min(0).max(MAX_ELEMENT_CREATED_AT),
};

const boxShape = { ...baseShape, width: sideSchema, height: sideSchema };

export const canvasElementSchema = z.discriminatedUnion("type", [
  z.strictObject({
    ...boxShape,
    type: z.literal("text"),
    content: contentSchema,
    fontSize: z.number().positive().max(MAX_ELEMENT_FONT_SIZE),
    fontWeight: z.enum(["normal", "bold"]),
    fontStyle: z.enum(["normal", "italic"]),
    color: colorSchema,
  }),
  z.strictObject({
    ...boxShape,
    type: z.literal("sticky"),
    content: contentSchema,
    color: z.enum(["yellow", "pink", "blue", "green", "purple"]),
  }),
  z.strictObject({
    ...boxShape,
    type: z.literal("shape"),
    shape: z.enum(["rectangle", "circle", "arrow"]),
    stroke: colorSchema,
    strokeWidth: z.number().min(0).max(MAX_ELEMENT_STROKE_WIDTH),
    fill: colorSchema.optional(),
  }),
  z.strictObject({
    ...baseShape,
    type: z.literal("path"),
    points: z.array(coordSchema).max(MAX_ELEMENT_PATH_POINTS),
    stroke: colorSchema,
    strokeWidth: z.number().min(0).max(MAX_ELEMENT_STROKE_WIDTH),
  }),
  z.strictObject({
    ...boxShape,
    type: z.literal("image"),
    src: z
      .url({ protocol: /^https$/, hostname: z.regexes.domain })
      .max(MAX_ELEMENT_SRC),
  }),
  z.strictObject({
    ...boxShape,
    type: z.literal("code"),
    language: z.enum([
      "javascript",
      "python",
      "typescript",
      "html",
      "css",
      "plaintext",
    ]),
    content: contentSchema,
  }),
]);

type Mirrors<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

export const CANVAS_ELEMENT_SCHEMA_MIRRORS_TYPE: Mirrors<
  z.infer<typeof canvasElementSchema>,
  CanvasElement
> = true;
