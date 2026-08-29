"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useStorageRoot,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react";
import CanvasToolbar from "../canvas-toolbar";
import CanvasSnapshot from "../canvas-snapshot";
import { useViewport } from "../canvas-stage/helpers/use-viewport";
import {
  useRecolorElement,
  type ColorTarget,
} from "../canvas-stage/helpers/use-canvas-mutations";
import { DEFAULT_SETTINGS } from "../helpers/constants";
import type { CanvasSettings } from "../helpers/types";

const CanvasStage = dynamic(() => import("../canvas-stage"), {
  ssr: false,
  loading: () => <div className="bg-bg h-full w-full" />,
});

interface Props {
  lessonId: string;
}

const LessonCanvas = ({ lessonId }: Props) => {
  const [settings, setSettings] = useState<CanvasSettings>(DEFAULT_SETTINGS);
  const updateMyPresence = useUpdateMyPresence();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [storageRoot] = useStorageRoot();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<ColorTarget | null>(null);
  const recolor = useRecolorElement();
  const {
    viewport,
    panning,
    spaceHeld,
    pinching,
    zoomStep,
    resetZoom,
    handlers,
  } = useViewport(container);

  const change = useCallback(
    (patch: Partial<CanvasSettings>) => {
      setSettings((current) => ({ ...current, ...patch }));
      if (patch.tool) updateMyPresence({ tool: patch.tool });
    },
    [updateMyPresence],
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <CanvasSnapshot lessonId={lessonId} />
      <CanvasStage
        settings={settings}
        onChange={change}
        container={container}
        onContainer={setContainer}
        viewport={viewport}
        panning={panning}
        spaceHeld={spaceHeld}
        pinching={pinching}
        onSelectionChange={setSelection}
        handlers={handlers}
      />
      <div className="border-border-subtle bg-surface absolute inset-x-3 bottom-3 z-10 rounded-[12px] border p-3 text-center shadow-(--shadow-medium) md:hidden">
        <p className="text-text-secondary text-[13px] leading-relaxed">
          Educatio works best on a laptop or tablet for live lessons. You can
          view this lesson here, but to draw and edit, switch to a larger
          screen.
        </p>
      </div>

      <CanvasToolbar
        className="hidden md:flex"
        settings={settings}
        onChange={change}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        ready={storageRoot !== null}
        selection={selection}
        onRecolor={(value) => selection && recolor(selection.id, value)}
        scale={viewport.scale}
        onZoom={zoomStep}
        onResetZoom={resetZoom}
      />
    </div>
  );
};

export default LessonCanvas;
