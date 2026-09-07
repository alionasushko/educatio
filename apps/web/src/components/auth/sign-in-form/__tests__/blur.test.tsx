import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/sign-in/actions", () => ({
  signinAction: vi.fn(async () => ({ ok: true, data: undefined })),
  signinPasswordAction: vi.fn(async () => ({ ok: true, data: undefined })),
}));

const { default: SignInForm } = await import("../index");

describe("what leaving the email field says about it", () => {
  it("says nothing about an email the tutor never typed", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const email = screen.getByLabelText(/email/i);
    expect(email).toHaveFocus();

    await user.click(screen.getByLabelText(/password/i));

    expect(screen.queryByText("Enter a valid email address.")).toBeNull();
  });

  it("still says nothing after the tutor types and clears it again", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    const email = screen.getByLabelText(/email/i);
    await user.type(email, "sara@");
    await user.clear(email);
    await user.click(screen.getByLabelText(/password/i));

    expect(screen.queryByText("Enter a valid email address.")).toBeNull();
  });

  it("does report an email that was typed wrongly", async () => {
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.type(screen.getByLabelText(/email/i), "sara@");
    await user.click(screen.getByLabelText(/password/i));

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeVisible();
  });
});
