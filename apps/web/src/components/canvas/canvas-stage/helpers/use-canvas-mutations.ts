import { useMutation } from "@liveblocks/react";

export const useMoveElement = () =>
  useMutation(({ storage }, id: string, x: number, y: number) => {
    const elements = storage.get("elements");
    const element = elements.get(id);
    if (!element) return;
    elements.set(id, { ...element, x, y });
    storage.get("metadata").update({ lastEditedAt: Date.now() });
  }, []);

export const useDeleteElement = () =>
  useMutation(({ storage }, id: string) => {
    const elements = storage.get("elements");
    if (!elements.delete(id)) return;
    storage.get("metadata").update({
      lastEditedAt: Date.now(),
      elementCount: elements.size,
    });
  }, []);
