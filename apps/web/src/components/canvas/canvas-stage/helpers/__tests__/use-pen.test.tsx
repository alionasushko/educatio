import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePen } from "../use-pen";

const updateMyPresence = vi.fn();
vi.mock("@liveblocks/react", () => ({
  useUpdateMyPresence: () => updateMyPresence,
}));

const container = document.createElement("div");
container.getBoundingClientRect = () =>
  ({ left: 0, top: 0, width: 800, height: 600 }) as DOMRect;

const pointer = (clientX: number, clientY: number) =>
  ({
    button: 0,
    clientX,
    clientY,
    currentTarget: { setPointerCapture: vi.fn() },
    pointerId: 1,
  }) as unknown as React.PointerEvent<HTMLDivElement>;

const setup = (onCommit = vi.fn()) => {
  const { result } = renderHook(() =>
    usePen({
      container,
      viewport: { x: 0, y: 0, scale: 1 },
      tool: "pen",
      enabled: true,
      stroke: "--accent-brand",
      strokeWidth: 4,
      onCommit,
    }),
  );
  return { result, onCommit };
};

const draftsSent = () =>
  updateMyPresence.mock.calls
    .map(([patch]) => (patch as { draft: { points: number[] } | null }).draft)
    .filter(Boolean);

describe("usePen presence broadcast", () => {
  beforeEach(() => updateMyPresence.mockClear());

  it("publishes the stroke while it is being drawn, not only on release", () => {
    const { result } = setup();

    act(() => result.current.handlers.onPointerDown(pointer(100, 100)));
    act(() => result.current.handlers.onPointerMove(pointer(140, 130)));
    act(() => result.current.handlers.onPointerMove(pointer(180, 170)));

    const drafts = draftsSent();
    expect(drafts.length).toBeGreaterThanOrEqual(3);
    expect(drafts.at(-1)?.points.length).toBeGreaterThan(
      drafts[0]?.points.length ?? 0,
    );
  });

  it("carries the drawer's colour and weight so a peer draws it the same", () => {
    const { result } = setup();
    act(() => result.current.handlers.onPointerDown(pointer(10, 10)));

    expect(updateMyPresence).toHaveBeenCalledWith({
      draft: expect.objectContaining({
        stroke: "--accent-brand",
        strokeWidth: 4,
      }),
    });
  });

  it("clears the draft on release so the committed element is not doubled", () => {
    const { result, onCommit } = setup();

    act(() => result.current.handlers.onPointerDown(pointer(100, 100)));
    act(() => result.current.handlers.onPointerMove(pointer(160, 150)));
    act(() => result.current.handlers.onPointerUp());

    expect(updateMyPresence).toHaveBeenLastCalledWith({ draft: null });
    expect(onCommit).toHaveBeenCalledOnce();
  });
});
