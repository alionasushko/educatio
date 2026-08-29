import {
  CodeIcon,
  ImageIcon,
  MousePointer2Icon,
  PenLineIcon,
  SquareIcon,
  StickyNoteIcon,
  TypeIcon,
  type LucideIcon,
} from "lucide-react";
import type { CanvasTool } from "@/lib/liveblocks.config";

export interface ToolDefinition {
  tool: CanvasTool;
  label: string;
  shortcut: string;
  Icon: LucideIcon;
}

export const TOOLS: ToolDefinition[] = [
  { tool: "select", label: "Select", shortcut: "V", Icon: MousePointer2Icon },
  { tool: "pen", label: "Pen", shortcut: "P", Icon: PenLineIcon },
  { tool: "text", label: "Text", shortcut: "T", Icon: TypeIcon },
  { tool: "sticky", label: "Sticky note", shortcut: "S", Icon: StickyNoteIcon },
  { tool: "shape", label: "Shape", shortcut: "R", Icon: SquareIcon },
  { tool: "image", label: "Image", shortcut: "I", Icon: ImageIcon },
  { tool: "code", label: "Code block", shortcut: "C", Icon: CodeIcon },
];

export const INK_TOOLS: CanvasTool[] = ["pen", "text", "shape"];

export const STROKE_TOOLS: CanvasTool[] = ["pen", "shape"];

export const TOOL_BY_SHORTCUT = new Map(
  TOOLS.map(({ tool, shortcut }) => [shortcut.toLowerCase(), tool]),
);
