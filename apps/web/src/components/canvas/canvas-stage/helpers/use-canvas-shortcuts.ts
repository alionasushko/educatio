import { useEffect } from "react";
import { isTypingTarget } from "./helpers";

interface Options {
  onDelete: () => void;
  onDeselect: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const useCanvasShortcuts = ({
  onDelete,
  onDeselect,
  onUndo,
  onRedo,
}: Options) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) onRedo();
        else onUndo();
        return;
      }

      if (event.key === "Escape") {
        onDeselect();
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        onDelete();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDelete, onDeselect, onUndo, onRedo]);
};
