import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Input from "../input";

describe("the message a field shows", () => {
  it("keeps the region mounted before there is anything to say", () => {
    const { container } = render(<Input label="Email" />);
    const region = container.querySelector("[aria-live]");

    expect(region).not.toBeNull();
    expect(region).toBeEmptyDOMElement();
  });

  it("announces politely rather than shouting", () => {
    const { container } = render(<Input label="Email" error="Not an email." />);

    expect(container.querySelector("[aria-live]")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("ties the message to the input and marks it invalid only on an error", () => {
    const { rerender } = render(<Input label="Email" helper="Work address." />);
    const field = screen.getByLabelText("Email");

    expect(field).not.toHaveAttribute("aria-invalid");
    expect(field).toHaveAccessibleDescription("Work address.");

    rerender(<Input label="Email" error="Not an email." />);
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("Not an email.");
  });

  it("does not hide the region from assistive tech once it has content", () => {
    const { container } = render(<Input label="Email" error="Not an email." />);

    expect(container.querySelector("[aria-live]")).not.toHaveAttribute(
      "aria-hidden",
    );
  });
});
