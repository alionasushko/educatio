import type { LiveMap, LiveObject } from "@liveblocks/client";
import type { CanvasElement, SessionClaims } from "@educatio/shared";

export type ParticipantRole = SessionClaims["kind"];

export type CanvasTool =
  | "select"
  | "pen"
  | "text"
  | "sticky"
  | "shape"
  | "image"
  | "code";

export type CanvasCursor = {
  x: number;
  y: number;
};

export type DraftStroke = {
  x: number;
  y: number;
  points: number[];
  stroke: string;
  strokeWidth: number;
};

export type ElementTransform = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

export type CanvasMetadata = {
  lastEditedAt: number;
  elementCount: number;
};

declare global {
  interface Liveblocks {
    Presence: {
      cursor: CanvasCursor | null;
      name: string;
      role: ParticipantRole;
      color: string;
      selection: string[] | null;
      tool: CanvasTool;
      draft: DraftStroke | null;
      transforming: ElementTransform | null;
    };
    Storage: {
      elements: LiveMap<string, CanvasElement>;
      metadata: LiveObject<CanvasMetadata>;
    };
    RoomEvent: { type: "lesson-ended" };
    UserMeta: {
      id: string;
      info: {
        name: string;
        role: ParticipantRole;
      };
    };
  }
}
