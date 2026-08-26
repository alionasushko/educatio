"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@liveblocks/react";
import type { CanvasElement } from "@educatio/shared";
import { persistCanvas } from "@/app/lesson/[lessonId]/actions";
import { SNAPSHOT_INTERVAL_MS } from "./helpers/constants";

interface Props {
  lessonId: string;
}

const CanvasSnapshot = ({ lessonId }: Props) => {
  const savedAt = useRef(0);
  const saving = useRef(false);

  const readCanvas = useMutation(({ storage }) => {
    const elements = storage.get("elements");
    const canvasState: Record<string, CanvasElement> = {};
    for (const [id, element] of elements.entries()) canvasState[id] = element;
    return {
      canvasState,
      editedAt: storage.get("metadata").get("lastEditedAt"),
    };
  }, []);

  useEffect(() => {
    const save = async () => {
      if (saving.current) return;
      const snapshot = readCanvas();
      if (!snapshot || snapshot.editedAt <= savedAt.current) return;

      saving.current = true;
      const pendingAt = snapshot.editedAt;
      try {
        const result = await persistCanvas(lessonId, snapshot.canvasState);
        if (result.ok) savedAt.current = pendingAt;
        else console.error(result.error);
      } catch (err) {
        console.error(err);
      } finally {
        saving.current = false;
      }
    };

    const timer = setInterval(() => void save(), SNAPSHOT_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      void save();
    };
  }, [lessonId, readCanvas]);

  return null;
};

export default CanvasSnapshot;
