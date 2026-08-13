import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PenLineIcon } from "lucide-react";
import ToolButton from "../components/tool-button";

const setup = (props: Partial<Parameters<typeof ToolButton>[0]> = {}) => {
  const onClick = vi.fn();
  render(
    <ToolButton
      label="Pen"
      shortcut="P"
      Icon={PenLineIcon}
      onClick={onClick}
      {...props}
    />,
  );
  return { onClick };
};

describe("ToolButton", () => {
  it("names itself and its shortcut for screen readers", () => {
    setup();
    expect(screen.getByRole("button", { name: "Pen (P)" })).toBeInTheDocument();
  });

  it("announces as a toggle only when it represents a tool", () => {
    setup({ active: false });
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("announces as pressed when its tool is selected", () => {
    setup({ active: true });
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("omits aria-pressed for a command, which is not a toggle", () => {
    setup({ label: "Undo", shortcut: "Cmd+Z" });
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
  });

  it("calls back when pressed", async () => {
    const { onClick } = setup();
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("cannot be pressed while disabled", async () => {
    const { onClick } = setup({ disabled: true });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    expect(onClick).not.toHaveBeenCalled();
  });
});
