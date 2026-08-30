import type { CanvasElement } from "@educatio/shared";
import Board from "./components/board";

export const BOARD_LABEL =
  "The whiteboard as it was left at the end of the lesson";

interface Props {
  elements: CanvasElement[];
}

const CanvasThumbnail = ({ elements }: Props) => {
  if (elements.length === 0) return null;

  return (
    <figure className="border-border-subtle bg-bg overflow-hidden rounded-md border">
      <Board
        elements={elements}
        label={BOARD_LABEL}
        className="block h-auto max-h-100 w-full"
      />
    </figure>
  );
};

export default CanvasThumbnail;
