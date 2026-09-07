import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TryDemoButton from "../index";

const button = () => screen.getByRole("button");

describe("waiting for the demo to open", () => {
  it("says nothing about waiting until it is asked to open", () => {
    render(<TryDemoButton />);

    expect(button()).toHaveTextContent(/explore the demo/i);
    expect(button()).not.toHaveAttribute("aria-busy", "true");
  });

  it("reports that it is working once submitted", () => {
    render(<TryDemoButton />);
    fireEvent.submit(button().closest("form")!);

    expect(button()).toHaveTextContent("Opening the demo…");
    expect(button()).toHaveAttribute("aria-busy", "true");
  });

  it("refuses a second submit while the first is in flight", () => {
    render(<TryDemoButton />);
    const form = button().closest("form")!;

    expect(fireEvent.submit(form)).toBe(true);
    expect(fireEvent.submit(form)).toBe(false);
  });

  it("stops waiting when the page comes back from the browser's cache", () => {
    render(<TryDemoButton />);
    fireEvent.submit(button().closest("form")!);
    expect(button()).toHaveAttribute("aria-busy", "true");

    const restored = new Event("pageshow") as PageTransitionEvent;
    Object.defineProperty(restored, "persisted", { value: true });
    fireEvent(window, restored);

    expect(button()).not.toHaveAttribute("aria-busy", "true");
    expect(button()).toHaveTextContent(/explore the demo/i);
  });

  it("keeps a caller's own label until it starts working", () => {
    render(<TryDemoButton label="Explore the demo" />);

    expect(button()).toHaveTextContent("Explore the demo");
    fireEvent.submit(button().closest("form")!);
    expect(button()).toHaveTextContent("Opening the demo…");
  });
});
