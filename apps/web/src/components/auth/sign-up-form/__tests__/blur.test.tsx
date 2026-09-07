import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/sign-up/actions", () => ({
  signupAction: vi.fn(async () => ({ ok: true, data: undefined })),
}));

const { default: SignUpForm } = await import("../index");

describe("what leaving a field says about it", () => {
  it("says nothing about a field the tutor never filled in", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const name = screen.getByLabelText(/your name/i);
    expect(name).toHaveFocus();

    await user.click(screen.getByLabelText(/email/i));

    expect(screen.queryByText("Please enter your name.")).toBeNull();
  });

  it("still says nothing after the tutor types and clears it again", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const name = screen.getByLabelText(/your name/i);
    await user.type(name, "Sara");
    await user.clear(name);
    await user.click(screen.getByLabelText(/email/i));

    expect(screen.queryByText("Please enter your name.")).toBeNull();
  });

  it("does report a field the tutor filled in wrongly", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.click(screen.getByLabelText(/your name/i));

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeVisible();
  });

  it("reports every empty required field once the form is submitted", async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Please enter your name.")).toBeVisible();
  });
});
