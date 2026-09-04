"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEventListener, useStorageRoot } from "@liveblocks/react";
import { toast } from "sonner";
import { persistCanvas } from "@/app/lesson/[lessonId]/actions";
import { useReadCanvas } from "./helpers/use-read-canvas";
import {
  SNAPSHOT_INTERVAL_MS,
  SNAPSHOT_SAVE_FAILED,
} from "./helpers/constants";

interface Props {
  lessonId: string;
}

const CanvasSnapshot = ({ lessonId }: Props) => {
  const savedAt = useRef(0);
  const saving = useRef(false);
  const loaded = useRef(false);
  const closed = useRef(false);
  const warned = useRef(false);
  const [storageRoot] = useStorageRoot();

  useEffect(() => {
    loaded.current = storageRoot !== null;
  }, [storageRoot]);

  const readCanvas = useReadCanvas();

  const reportFailure = useCallback((message: string) => {
    if (warned.current) return;
    warned.current = true;
    toast.error(message);
  }, []);

  const save = useCallback(async () => {
    if (saving.current || !loaded.current) return;
    saving.current = true;
    try {
      const snapshot = readCanvas();
      if (!snapshot || snapshot.editedAt <= savedAt.current) return;

      const result = await persistCanvas(lessonId, snapshot.canvasState);
      if (result.ok) {
        savedAt.current = snapshot.editedAt;
        warned.current = false;
      } else {
        reportFailure(result.error);
      }
    } catch {
      reportFailure(SNAPSHOT_SAVE_FAILED);
    } finally {
      saving.current = false;
    }
  }, [lessonId, readCanvas, reportFailure]);

  useEventListener(({ event }) => {
    if (event.type === "lesson-ended") closed.current = true;
  });

  useEffect(() => {
    const timer = setInterval(() => void save(), SNAPSHOT_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      if (!closed.current) void save();
    };
  }, [save]);

  return null;
};

export default CanvasSnapshot;
