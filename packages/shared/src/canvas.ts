export type StickyColor = "yellow" | "pink" | "blue" | "green" | "purple";

export type ShapeKind = "rectangle" | "circle" | "arrow";

export type CodeLanguage =
  | "javascript"
  | "python"
  | "typescript"
  | "html"
  | "css"
  | "plaintext";

export type BaseElement = {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  createdBy: string;
  createdAt: number;
};

export type TextElement = BaseElement & {
  type: "text";
  width: number;
  height: number;
  content: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  color: string;
};

export type StickyNoteElement = BaseElement & {
  type: "sticky";
  width: number;
  height: number;
  content: string;
  color: StickyColor;
};

export type ShapeElement = BaseElement & {
  type: "shape";
  shape: ShapeKind;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
};

export type DrawPathElement = BaseElement & {
  type: "path";
  points: number[];
  stroke: string;
  strokeWidth: number;
};

export type ImageElement = BaseElement & {
  type: "image";
  width: number;
  height: number;
  src: string;
};

export type CodeBlockElement = BaseElement & {
  type: "code";
  width: number;
  height: number;
  language: CodeLanguage;
  content: string;
};

export type CanvasElement =
  | TextElement
  | StickyNoteElement
  | ShapeElement
  | DrawPathElement
  | ImageElement
  | CodeBlockElement;
