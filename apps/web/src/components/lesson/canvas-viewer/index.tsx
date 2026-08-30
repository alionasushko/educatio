"use client";

import { useState } from "react";
import { ExpandIcon } from "lucide-react";
import type { CanvasElement } from "@educatio/shared";
import Dialog from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { useViewport } from "@/components/canvas/canvas-stage/helpers/use-viewport";
import ZoomControls from "@/components/canvas/canvas-toolbar/components/zoom-controls";
import Board from "@/components/lesson/canvas-thumbnail/components/board";
import { BOARD_LABEL } from "@/components/lesson/canvas-thumbnail";
import { cn } from "@/lib/utils";

interface Props {
  elements: CanvasElement[];
}

const CanvasViewer = ({ elements }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 gap-1.5 px-3 text-sm",
        )}
      >
        <ExpandIcon className="size-4" aria-hidden="true" />
        View canvas
      </button>

      {open && (
        <ViewerDialog elements={elements} onClose={() => setOpen(false)} />
      )}
    </>
  );
};

interface DialogProps {
  elements: CanvasElement[];
  onClose: () => void;
}

const ViewerDialog = ({ elements, onClose }: DialogProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const { viewport, panning, zoomStep, resetZoom, handlers } = useViewport(
    container,
    { panWithPrimary: true },
  );

  return (
    <Dialog onClose={onClose} label={BOARD_LABEL} className="max-w-260 p-0">
      <div className="relative">
        <div
          ref={setContainer}
          className="bg-bg relative h-[70vh] touch-none overflow-hidden rounded-md"
          style={{ cursor: panning ? "grabbing" : "grab" }}
          {...handlers}
        >
          <div
            className="absolute origin-top-left"
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            }}
          >
            <Board
              elements={elements}
              label={BOARD_LABEL}
              className="pointer-events-none block h-auto w-250 max-w-none select-none"
            />
          </div>
        </div>

        <div className="border-border-subtle bg-surface absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center rounded-[14px] border p-1.5 shadow-(--shadow-medium)">
          <ZoomControls
            scale={viewport.scale}
            onZoom={zoomStep}
            onReset={resetZoom}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default CanvasViewer;
