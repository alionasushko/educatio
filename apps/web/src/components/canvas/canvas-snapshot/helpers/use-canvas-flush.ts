"use client";

import { useCallback } from "react";
import { useMutation } from "@liveblocks/react";
import type { CanvasElement } from "@educatio/shared";
import { persistCanvas } from "@/app/lesson/[lessonId]/actions";

export const useCanvasFlush = (lessonId: string) => {
  const readCanvas = useMutation(({ storage }) => {
    const elements = storage.get("elements");
    const canvasState: Record<string, CanvasElement> = {};
    for (const [id, element] of elements.entries()) canvasState[id] = element;
    return {
      canvasState,
      editedAt: storage.get("metadata").get("lastEditedAt"),
    };
  }, []);

  return useCallback(async () => {
    try {
      const snapshot = readCanvas();
      if (!snapshot) return false;
      const result = await persistCanvas(lessonId, snapshot.canvasState);
      return result.ok;
    } catch {
      return false;
    }
  }, [lessonId, readCanvas]);
};
