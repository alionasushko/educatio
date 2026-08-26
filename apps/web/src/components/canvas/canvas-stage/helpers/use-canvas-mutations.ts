import { useMutation } from "@liveblocks/react";
import { nanoid } from "nanoid";
import type { LiveMap } from "@liveblocks/client";
import type { CanvasElement } from "@educatio/shared";
import type { CanvasSettings } from "../../helpers/types";
import { createElement, type CreatableTool } from "./element-factory";

const nextZIndex = (elements: LiveMap<string, CanvasElement>): number =>
  Array.from(elements.values()).reduce(
    (top, element) => Math.max(top, element.zIndex),
    0,
  ) + 1;

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
    (
      { storage, self },
      tool: CreatableTool,
      x: number,
      y: number,
      settings: CanvasSettings,
    ): string => {
      const elements = storage.get("elements");
      const element = createElement(tool, {
        x,
        y,
        createdBy: self.id,
        zIndex: nextZIndex(elements),
        settings,
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

export const useCreatePath = () =>
  useMutation(
    (
      { storage, self },
      x: number,
      y: number,
      points: number[],
      stroke: string,
      strokeWidth: number,
    ) => {
      const elements = storage.get("elements");
      const element: CanvasElement = {
        id: nanoid(10),
        type: "path",
        x,
        y,
        rotation: 0,
        zIndex: nextZIndex(elements),
        createdBy: self.id,
        createdAt: Date.now(),
        points,
        stroke,
        strokeWidth,
      };
      elements.set(element.id, element);
      storage.get("metadata").update({
        lastEditedAt: Date.now(),
        elementCount: elements.size,
      });
    },
    [],
  );

export const useCreateImage = () =>
  useMutation(
    (
      { storage, self },
      src: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      const elements = storage.get("elements");
      const element: CanvasElement = {
        id: nanoid(10),
        type: "image",
        x,
        y,
        rotation: 0,
        zIndex: nextZIndex(elements),
        createdBy: self.id,
        createdAt: Date.now(),
        width,
        height,
        src,
      };
      elements.set(element.id, element);
      storage.get("metadata").update({
        lastEditedAt: Date.now(),
        elementCount: elements.size,
      });
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
