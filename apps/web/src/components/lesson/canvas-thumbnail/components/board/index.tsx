import type { CanvasElement } from "@educatio/shared";
import { boundsOf } from "../../helpers/helpers";
import BoardElement from "./components/board-element";

const PADDING = 32;

interface BoardProps {
  elements: CanvasElement[];
  label: string;
  className?: string;
}

const Board = ({ elements, label, className }: BoardProps) => {
  const view = boundsOf(elements, PADDING);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={{ fontFamily: "var(--font-sans), sans-serif" }}
    >
      {elements.map((element) => (
        <BoardElement key={element.id} element={element} />
      ))}
    </svg>
  );
};

export default Board;
