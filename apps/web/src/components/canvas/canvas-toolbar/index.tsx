"use client";

import { Redo2Icon, Undo2Icon } from "lucide-react";
import type { StickyColor } from "@educatio/shared";
import { INK_COLORS, STICKY_ORDER, STICKY_TOKEN } from "../helpers/constants";
import type { CanvasSettings } from "../helpers/types";
import ToolButton from "./components/tool-button";
import ColorPicker from "./components/color-picker";
import StrokePicker from "./components/stroke-picker";
import { TOOLS } from "./helpers/constants";

interface Props {
  settings: CanvasSettings;
  onChange: (patch: Partial<CanvasSettings>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  ready: boolean;
}

const Divider = () => (
  <span
    className="bg-border-subtle mx-1 h-6 w-px shrink-0"
    aria-hidden="true"
  />
);

const CanvasToolbar = ({
  settings,
  onChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  ready,
}: Props) => {
  const { tool } = settings;
  const inks = tool === "pen" || tool === "text" || tool === "shape";
  const strokes = tool === "pen" || tool === "shape";
  const stickies = tool === "sticky";

  return (
    <div
      role="toolbar"
      aria-label="Canvas tools"
      aria-orientation="horizontal"
      className="border-border-subtle bg-surface absolute bottom-5 left-1/2 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-[14px] border p-1.5 shadow-(--shadow-medium)"
    >
      {TOOLS.map(({ tool: value, label, shortcut, Icon }) => (
        <ToolButton
          key={value}
          label={label}
          shortcut={shortcut}
          Icon={Icon}
          active={tool === value}
          disabled={!ready}
          onClick={() => onChange({ tool: value })}
        />
      ))}

      {(inks || stickies) && <Divider />}

      {inks && (
        <ColorPicker
          label="Color"
          swatches={INK_COLORS.map(({ token, label }) => ({
            token,
            label,
            value: token,
          }))}
          selected={settings.inkToken}
          onSelect={(inkToken) => onChange({ inkToken })}
          disabled={!ready}
        />
      )}

      {stickies && (
        <ColorPicker
          label="Sticky color"
          swatches={STICKY_ORDER.map((color) => ({
            token: STICKY_TOKEN[color],
            label: `${color[0]?.toUpperCase()}${color.slice(1)}`,
            value: color,
          }))}
          selected={settings.stickyColor}
          onSelect={(value) => onChange({ stickyColor: value as StickyColor })}
          disabled={!ready}
        />
      )}

      {strokes && (
        <StrokePicker
          selected={settings.strokeWidth}
          onSelect={(strokeWidth) => onChange({ strokeWidth })}
          disabled={!ready}
        />
      )}

      <Divider />

      <ToolButton
        label="Undo"
        shortcut="Cmd+Z"
        Icon={Undo2Icon}
        onClick={onUndo}
        disabled={!ready || !canUndo}
      />
      <ToolButton
        label="Redo"
        shortcut="Cmd+Shift+Z"
        Icon={Redo2Icon}
        onClick={onRedo}
        disabled={!ready || !canRedo}
      />
    </div>
  );
};

export default CanvasToolbar;
