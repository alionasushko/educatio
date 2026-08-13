import { useMutation } from "@liveblocks/react";
import type { CanvasElement } from "@educatio/shared";
import { createElement, type CreatableTool } from "./element-factory";

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

export const useCreateElement = () =>
  useMutation(
    ({ storage, self }, tool: CreatableTool, x: number, y: number): string => {
      const elements = storage.get("elements");
      const topZIndex = Array.from(elements.values()).reduce(
        (top, element) => Math.max(top, element.zIndex),
        0,
      );
      const element = createElement(tool, {
        x,
        y,
        createdBy: self.id ?? self.info.name,
        zIndex: topZIndex + 1,
      });
      elements.set(element.id, element);
      storage.get("metadata").update({
        lastEditedAt: Date.now(),
        elementCount: elements.size,
      });
      return element.id;
    },
    [],
  );

export const useUpdateElementText = () =>
  useMutation(({ storage }, id: string, content: string, height: number) => {
    const elements = storage.get("elements");
    const element = elements.get(id);
    if (!element || !("content" in element)) return;
    if (element.content === content && element.height === height) return;
    elements.set(id, { ...element, content, height } as CanvasElement);
    storage.get("metadata").update({ lastEditedAt: Date.now() });
  }, []);
