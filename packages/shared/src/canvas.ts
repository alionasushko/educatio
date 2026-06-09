export type StickyColor = "yellow" | "pink" | "blue" | "green" | "purple";

export type ShapeKind = "rectangle" | "circle" | "arrow";

export type CodeLanguage =
  | "javascript"
  | "python"
  | "typescript"
  | "html"
  | "css"
  | "plaintext";

export interface BaseElement {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  createdBy: string;
  createdAt: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  width: number;
  height: number;
  content: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  color: string;
}

export interface StickyNoteElement extends BaseElement {
  type: "sticky";
  width: number;
  height: number;
  content: string;
  color: StickyColor;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shape: ShapeKind;
  width: number;
  height: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
}

export interface DrawPathElement extends BaseElement {
  type: "path";
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  width: number;
  height: number;
  src: string;
}

export interface CodeBlockElement extends BaseElement {
  type: "code";
  width: number;
  height: number;
  language: CodeLanguage;
  content: string;
}

export type CanvasElement =
  | TextElement
  | StickyNoteElement
  | ShapeElement
  | DrawPathElement
  | ImageElement
  | CodeBlockElement;
