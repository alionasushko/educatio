import type { StickyColor } from "@educatio/shared";
import type { CanvasTool } from "@/lib/liveblocks.config";

export interface CanvasSettings {
  tool: CanvasTool;
  inkToken: string;
  stickyColor: StickyColor;
  strokeWidth: number;
}
