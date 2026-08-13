"use client";

import { Redo2Icon, Undo2Icon } from "lucide-react";
import type { CanvasTool } from "@/lib/liveblocks.config";
import ToolButton from "./components/tool-button";
import { TOOLS } from "./helpers/constants";

interface Props {
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const CanvasToolbar = ({
  tool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) => (
  <div
    role="toolbar"
    aria-label="Canvas tools"
    aria-orientation="horizontal"
    className="border-border-subtle bg-surface absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-[14px] border p-1.5 shadow-[var(--shadow-medium)]"
  >
    {TOOLS.map(({ tool: value, label, shortcut, Icon }) => (
      <ToolButton
        key={value}
        label={label}
        shortcut={shortcut}
        Icon={Icon}
        active={tool === value}
        onClick={() => onToolChange(value)}
      />
    ))}

    <span className="bg-border-subtle mx-1 h-6 w-px" aria-hidden="true" />

    <ToolButton
      label="Undo"
      shortcut="Cmd+Z"
      Icon={Undo2Icon}
      onClick={onUndo}
      disabled={!canUndo}
    />
    <ToolButton
      label="Redo"
      shortcut="Cmd+Shift+Z"
      Icon={Redo2Icon}
      onClick={onRedo}
      disabled={!canRedo}
    />
  </div>
);

export default CanvasToolbar;
