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
import { DEFAULT_SETTINGS } from "../helpers/constants";
import type { CanvasSettings } from "../helpers/types";

const CanvasStage = dynamic(() => import("../canvas-stage"), {
  ssr: false,
  loading: () => <div className="bg-bg h-full w-full" />,
});

const LessonCanvas = () => {
  const [settings, setSettings] = useState<CanvasSettings>(DEFAULT_SETTINGS);
  const updateMyPresence = useUpdateMyPresence();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [storageRoot] = useStorageRoot();

  const change = useCallback(
    (patch: Partial<CanvasSettings>) => {
      setSettings((current) => ({ ...current, ...patch }));
      if (patch.tool) updateMyPresence({ tool: patch.tool });
    },
    [updateMyPresence],
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <CanvasStage settings={settings} onChange={change} />
      <CanvasToolbar
        settings={settings}
        onChange={change}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        ready={storageRoot !== null}
      />
    </div>
  );
};

export default LessonCanvas;
