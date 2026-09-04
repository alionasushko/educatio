"use client";

import { useMutation } from "@liveblocks/react";
import type { CanvasElement } from "@educatio/shared";

export interface CanvasRead {
  canvasState: Record<string, CanvasElement>;
  editedAt: number;
}

export const useReadCanvas = () =>
  useMutation(({ storage }): CanvasRead => {
    const elements = storage.get("elements");
    const canvasState: Record<string, CanvasElement> = {};
    for (const [id, element] of elements.entries()) canvasState[id] = element;
    return {
      canvasState,
      editedAt: storage.get("metadata").get("lastEditedAt"),
    };
  }, []);
