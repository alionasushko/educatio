import { useEffect } from "react";
import type { CanvasTool } from "@/lib/liveblocks.config";
import { TOOL_BY_SHORTCUT } from "../../canvas-toolbar/helpers/constants";
import { isTypingTarget } from "./helpers";

interface Options {
  canEdit: boolean;
  onDelete: () => void;
  onDeselect: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTool: (tool: CanvasTool) => void;
}

export const useCanvasShortcuts = ({
  canEdit,
  onDelete,
  onDeselect,
  onUndo,
  onRedo,
  onTool,
}: Options) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        if (!canEdit) return;
        event.preventDefault();
        if (event.shiftKey) onRedo();
        else onUndo();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Escape") {
        onDeselect();
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        if (!canEdit) return;
        event.preventDefault();
        onDelete();
        return;
      }

      const tool = TOOL_BY_SHORTCUT.get(event.key.toLowerCase());
      if (tool && (canEdit || tool === "select")) onTool(tool);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canEdit, onDelete, onDeselect, onUndo, onRedo, onTool]);
};
