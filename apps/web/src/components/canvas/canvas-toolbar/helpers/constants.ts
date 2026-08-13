import {
  CodeIcon,
  MousePointer2Icon,
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
  { tool: "text", label: "Text", shortcut: "T", Icon: TypeIcon },
  { tool: "sticky", label: "Sticky note", shortcut: "S", Icon: StickyNoteIcon },
  { tool: "shape", label: "Rectangle", shortcut: "R", Icon: SquareIcon },
  { tool: "code", label: "Code block", shortcut: "C", Icon: CodeIcon },
];

export const TOOL_BY_SHORTCUT = new Map(
  TOOLS.map(({ tool, shortcut }) => [shortcut.toLowerCase(), tool]),
);
