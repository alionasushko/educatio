import type { CanvasElement } from "@educatio/shared";
import { STICKY_TOKEN } from "@/components/canvas/helpers/constants";
import {
  LINE_HEIGHT,
  MONO_RATIO,
  arrowHead,
  boundsOf,
  extentOf,
  fitLines,
  pathPoints,
  rotationOf,
  safeImageSrc,
} from "../../helpers/helpers";

const PADDING = 32;
const STICKY_INSET = 12;
const STICKY_FONT = 15;
const CODE_INSET = 10;
const CODE_FONT = 13;

interface LinesProps {
  lines: string[];
  x: number;
  fontSize: number;
}

const Lines = ({ lines, x, fontSize }: LinesProps) => (
  <>
    {lines.map((line, index) => (
      <tspan key={index} x={x} dy={index === 0 ? 0 : fontSize * LINE_HEIGHT}>
        {line}
      </tspan>
    ))}
  </>
);

const Element = ({ element }: { element: CanvasElement }) => {
  const box = extentOf(element);
  const transform = rotationOf(element, box);

  if (element.type === "sticky") {
    return (
      <g transform={transform}>
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          rx={4}
          style={{ fill: `var(${STICKY_TOKEN[element.color]})` }}
        />
        <text
          y={box.y + STICKY_INSET + STICKY_FONT}
          style={{ fill: "var(--text-primary)", fontSize: STICKY_FONT }}
        >
          <Lines
            x={box.x + STICKY_INSET}
            fontSize={STICKY_FONT}
            lines={fitLines(
              element.content,
              box.width - STICKY_INSET * 2,
              box.height - STICKY_INSET * 2,
              STICKY_FONT,
            )}
          />
        </text>
      </g>
    );
  }

  if (element.type === "text") {
    return (
      <text
        transform={transform}
        y={box.y + element.fontSize}
        style={{
          fill: `var(${element.color})`,
          fontSize: element.fontSize,
          fontWeight: element.fontWeight,
          fontStyle: element.fontStyle,
        }}
      >
        <Lines
          x={box.x}
          fontSize={element.fontSize}
          lines={fitLines(
            element.content,
            box.width,
            box.height,
            element.fontSize,
          )}
        />
      </text>
    );
  }

  if (element.type === "path") {
    return (
      <polyline
        points={pathPoints(element)}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={element.strokeWidth}
        style={{ stroke: `var(${element.stroke})` }}
      />
    );
  }

  if (element.type === "shape") {
    const stroke = { stroke: `var(${element.stroke})` };
    if (element.shape === "circle") {
      return (
        <ellipse
          transform={transform}
          cx={box.x + box.width / 2}
          cy={box.y + box.height / 2}
          rx={box.width / 2}
          ry={box.height / 2}
          fill="none"
          strokeWidth={element.strokeWidth}
          style={stroke}
        />
      );
    }
    if (element.shape === "arrow") {
      const tipX = box.x + box.width;
      const tipY = box.y + box.height;
      return (
        <g transform={transform}>
          <line
            x1={box.x}
            y1={box.y}
            x2={tipX}
            y2={tipY}
            strokeLinecap="round"
            strokeWidth={element.strokeWidth}
            style={stroke}
          />
          <polyline
            points={arrowHead(
              box.x,
              box.y,
              tipX,
              tipY,
              Math.max(10, element.strokeWidth * 3),
            )}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={element.strokeWidth}
            style={stroke}
          />
        </g>
      );
    }
    return (
      <rect
        transform={transform}
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        fill="none"
        strokeWidth={element.strokeWidth}
        style={stroke}
      />
    );
  }

  if (element.type === "code") {
    return (
      <g transform={transform}>
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          rx={4}
          style={{
            fill: "var(--surface)",
            stroke: "var(--border-medium)",
            strokeWidth: 1,
          }}
        />
        <text
          y={box.y + CODE_INSET + CODE_FONT}
          style={{
            fill: "var(--text-secondary)",
            fontSize: CODE_FONT,
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          <Lines
            x={box.x + CODE_INSET}
            fontSize={CODE_FONT}
            lines={fitLines(
              element.content,
              box.width - CODE_INSET * 2,
              box.height - CODE_INSET * 2,
              CODE_FONT,
              MONO_RATIO,
            )}
          />
        </text>
      </g>
    );
  }

  const src = safeImageSrc(element.src);
  if (!src) return null;
  return (
    <image
      transform={transform}
      href={src}
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      preserveAspectRatio="xMidYMid slice"
    />
  );
};

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
        <Element key={element.id} element={element} />
      ))}
    </svg>
  );
};

export default Board;
