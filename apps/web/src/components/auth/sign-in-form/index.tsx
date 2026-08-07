"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { signinSchema, passwordSigninSchema } from "@educatio/shared/api/auth";
import { signinAction, signinPasswordAction } from "@/app/sign-in/actions";

interface Props {
  callbackUrl?: string;
}

const SignInForm = ({ callbackUrl }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [magicPending, startMagicTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const isEmailValid = () =>
    signinSchema.safeParse({ email: email.trim() }).success;

  const focusField = (name: string) =>
    formRef.current
      ?.querySelector<HTMLInputElement>(`[name="${name}"]`)
      ?.focus();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(undefined);

    const parsed = passwordSigninSchema.safeParse({
      email: email.trim(),
      password,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setEmailError(flat.email ? "Enter a valid email address." : undefined);
      setPasswordError(flat.password ? "Enter your password." : undefined);
      focusField(flat.email ? "email" : "password");
      return;
    }
    setEmailError(undefined);
    setPasswordError(undefined);

    startTransition(async () => {
      const result = await signinPasswordAction(
        email.trim(),
        password,
        callbackUrl,
      );
      if (!result.ok) setFormError(result.error);
    });
  };

  const handleMagicLink = () => {
    setFormError(undefined);
    setPasswordError(undefined);
    if (!isEmailValid()) {
      setEmailError("Enter a valid email address.");
      focusField("email");
      return;
    }
    setEmailError(undefined);

    startMagicTransition(async () => {
      const result = await signinAction(email.trim(), callbackUrl);
      if (!result.ok) setFormError(result.error);
    });
  };

  const busy = isPending || magicPending;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="mb-4.5 flex flex-col gap-3.5">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@school.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() =>
            setEmailError(
              isEmailValid() ? undefined : "Enter a valid email address.",
            )
          }
          error={emailError}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError}
        />
      </div>

      {formError && (
        <p
          role="alert"
          className="text-destructive mb-3 text-[13px] leading-snug"
        >
          {formError}
        </p>
      )}

      <Button type="submit" disabled={busy} className="h-12 w-full text-[15px]">
        {isPending && (
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        )}
        {isPending ? "Signing in…" : "Sign in"}
      </Button>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={busy}
          className="text-text-secondary text-[13px] font-medium disabled:opacity-50"
        >
          {magicPending
            ? "Sending link…"
            : "Forgot your password? Email me a magic link"}
        </button>
      </div>
    </form>
  );
};

export default SignInForm;
