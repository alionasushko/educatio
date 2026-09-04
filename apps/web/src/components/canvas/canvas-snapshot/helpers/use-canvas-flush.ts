"use client";

import { useCallback } from "react";
import { persistCanvas } from "@/app/lesson/[lessonId]/actions";
import type { ActionResult } from "@/lib/api-error";
import { useReadCanvas } from "./use-read-canvas";
import { SNAPSHOT_SAVE_FAILED } from "./constants";

export const useCanvasFlush = (lessonId: string) => {
  const readCanvas = useReadCanvas();

  return useCallback(async (): Promise<ActionResult> => {
    try {
      const snapshot = readCanvas();
      if (!snapshot) return { ok: false, error: SNAPSHOT_SAVE_FAILED };
      return await persistCanvas(lessonId, snapshot.canvasState);
    } catch {
      return { ok: false, error: SNAPSHOT_SAVE_FAILED };
    }
  }, [lessonId, readCanvas]);
};
