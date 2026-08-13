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
import type { CanvasTool } from "@/lib/liveblocks.config";
import CanvasToolbar from "../canvas-toolbar";

const CanvasStage = dynamic(() => import("../canvas-stage"), {
  ssr: false,
  loading: () => <div className="bg-bg h-full w-full" />,
});

const LessonCanvas = () => {
  const [tool, setTool] = useState<CanvasTool>("select");
  const updateMyPresence = useUpdateMyPresence();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [storageRoot] = useStorageRoot();

  const changeTool = useCallback(
    (next: CanvasTool) => {
      setTool(next);
      updateMyPresence({ tool: next });
    },
    [updateMyPresence],
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <CanvasStage tool={tool} onToolChange={changeTool} />
      <CanvasToolbar
        tool={tool}
        onToolChange={changeTool}
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
