import { nanoid } from "nanoid";
import type { CanvasElement } from "@educatio/shared";
import type { CanvasTool } from "@/lib/liveblocks.config";
import { cssToken } from "./helpers";

export type CreatableTool = Exclude<CanvasTool, "select" | "pen" | "image">;

interface Origin {
  x: number;
  y: number;
  createdBy: string;
  zIndex: number;
}

const STICKY_SIZE = 190;

export const createElement = (
  tool: CreatableTool,
  { x, y, createdBy, zIndex }: Origin,
): CanvasElement => {
  const base = {
    id: nanoid(10),
    rotation: 0,
    zIndex,
    createdBy,
    createdAt: Date.now(),
  };

  switch (tool) {
    case "sticky":
      return {
        ...base,
        type: "sticky",
        x: x - STICKY_SIZE / 2,
        y: y - STICKY_SIZE / 2,
        width: STICKY_SIZE,
        height: STICKY_SIZE,
        content: "",
        color: "yellow",
      };
    case "text":
      return {
        ...base,
        type: "text",
        x,
        y,
        width: 260,
        height: 40,
        content: "",
        fontSize: 20,
        fontWeight: "normal",
        fontStyle: "normal",
        color: cssToken("--text-primary"),
      };
    case "shape":
      return {
        ...base,
        type: "shape",
        x,
        y,
        shape: "rectangle",
        width: 180,
        height: 120,
        stroke: cssToken("--accent-brand"),
        strokeWidth: 2,
      };
    case "code":
      return {
        ...base,
        type: "code",
        x,
        y,
        width: 340,
        height: 160,
        language: "plaintext",
        content: "",
      };
  }
};
