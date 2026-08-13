"use client";

import { useCallback, useEffect, type CSSProperties } from "react";
import { useHistory, useStorage } from "@liveblocks/react";
import {
  CANVAS_FONT,
  CANVAS_MONO_FONT,
  CODE_PADDING,
  MIN_TEXT_HEIGHT,
  STICKY_PADDING,
  STICKY_TOKEN,
} from "../../helpers/constants";
import { cssToken } from "../../helpers/helpers";
import { useUpdateElementText } from "../../helpers/use-canvas-mutations";
import type { Viewport } from "../../helpers/types";

interface Props {
  elementId: string;
  viewport: Viewport;
  onClose: () => void;
}

const contentHeight = (node: HTMLTextAreaElement): number => {
  const previous = node.style.height;
  node.style.height = "auto";
  const measured = node.scrollHeight;
  node.style.height = previous;
  return measured;
};

const TextEditor = ({ elementId, viewport, onClose }: Props) => {
  const element = useStorage((root) => root.elements[elementId]);
  const updateText = useUpdateElementText();
  const history = useHistory();

  useEffect(() => {
    history.pause();
    return () => history.resume();
  }, [history]);

  const editable =
    element?.type === "text" ||
    element?.type === "sticky" ||
    element?.type === "code";

  const padding = !editable
    ? 0
    : element.type === "sticky"
      ? STICKY_PADDING
      : element.type === "code"
        ? CODE_PADDING
        : 0;

  const minHeight = editable ? MIN_TEXT_HEIGHT[element.type] : 0;

  const fit = useCallback(
    (node: HTMLTextAreaElement) => {
      if (!editable) return;
      const needed = contentHeight(node) / viewport.scale + padding * 2;
      updateText(elementId, node.value, Math.max(minHeight, Math.ceil(needed)));
    },
    [editable, elementId, minHeight, padding, updateText, viewport.scale],
  );

  const onMount = useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (!node) return;
      node.focus();
      node.setSelectionRange(node.value.length, node.value.length);
      fit(node);
    },
    [fit],
  );

  if (!editable) return null;

  const scaled = (value: number) => value * viewport.scale;
  const fontSize =
    element.type === "text"
      ? element.fontSize
      : element.type === "code"
        ? 13
        : 15;

  const style: CSSProperties = {
    left: scaled(element.x) + viewport.x + scaled(padding),
    top: scaled(element.y) + viewport.y + scaled(padding),
    width: scaled(element.width - padding * 2),
    height: scaled(element.height - padding * 2),
    fontFamily: element.type === "code" ? CANVAS_MONO_FONT : CANVAS_FONT,
    fontSize: scaled(fontSize),
    lineHeight: element.type === "code" ? 1.5 : 1.35,
    color: element.type === "text" ? element.color : cssToken("--text-primary"),
    background:
      element.type === "sticky"
        ? cssToken(STICKY_TOKEN[element.color])
        : element.type === "code"
          ? cssToken("--surface")
          : "transparent",
  };

  return (
    <textarea
      ref={onMount}
      defaultValue={element.content}
      aria-label="Edit canvas text"
      spellCheck={false}
      onPointerDown={(event) => event.stopPropagation()}
      onChange={(event) => fit(event.currentTarget)}
      onBlur={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
      className="absolute resize-none overflow-hidden border-none outline-none"
      style={style}
    />
  );
};

export default TextEditor;
