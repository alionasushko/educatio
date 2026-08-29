"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  useEventListener,
  useMutation,
  useStorageRoot,
} from "@liveblocks/react";
import type { CanvasElement } from "@educatio/shared";
import { persistCanvas } from "@/app/lesson/[lessonId]/actions";
import { SNAPSHOT_INTERVAL_MS } from "./helpers/constants";

interface Props {
  lessonId: string;
}

const CanvasSnapshot = ({ lessonId }: Props) => {
  const savedAt = useRef(0);
  const saving = useRef(false);
  const loaded = useRef(false);
  const closing = useRef(false);
  const [storageRoot] = useStorageRoot();

  useEffect(() => {
    loaded.current = storageRoot !== null;
  }, [storageRoot]);

  const readCanvas = useMutation(({ storage }) => {
    const elements = storage.get("elements");
    const canvasState: Record<string, CanvasElement> = {};
    for (const [id, element] of elements.entries()) canvasState[id] = element;
    return {
      canvasState,
      editedAt: storage.get("metadata").get("lastEditedAt"),
    };
  }, []);

  const save = useCallback(async () => {
    if (saving.current || !loaded.current) return;
    saving.current = true;
    try {
      const snapshot = readCanvas();
      if (!snapshot || snapshot.editedAt <= savedAt.current) return;

      const result = await persistCanvas(lessonId, snapshot.canvasState);
      if (result.ok) savedAt.current = snapshot.editedAt;
      else if (!closing.current) console.error(result.error);
    } catch (err) {
      if (!closing.current) console.error(err);
    } finally {
      saving.current = false;
    }
  }, [lessonId, readCanvas]);

  useEventListener(({ event }) => {
    if (event.type !== "lesson-ended" || closing.current) return;
    closing.current = true;
    void save();
  });

  useEffect(() => {
    const timer = setInterval(() => void save(), SNAPSHOT_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      if (!closing.current) void save();
    };
  }, [save]);

  return null;
};

export default CanvasSnapshot;
