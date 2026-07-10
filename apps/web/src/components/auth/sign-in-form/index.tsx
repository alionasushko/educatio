"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { signinSchema } from "@educatio/shared/api/auth";
import { signinAction } from "@/app/sign-in/actions";

interface Props {
  callbackUrl?: string;
}

const SignInForm = ({ callbackUrl }: Props) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const emailError = () =>
    signinSchema.safeParse({ email: email.trim() }).success
      ? undefined
      : "Enter a valid email address.";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(undefined);
    const next = emailError();
    setError(next);
    if (next) {
      formRef.current
        ?.querySelector<HTMLInputElement>('[name="email"]')
        ?.focus();
      return;
    }

    startTransition(async () => {
      const result = await signinAction(email.trim(), callbackUrl);
      if (result?.error) setFormError(result.error);
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        autoFocus
        placeholder="you@school.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        onBlur={() => setError(emailError())}
        error={error}
      />

      {formError && (
        <p
          role="alert"
          className="text-destructive mb-3 text-[13px] leading-snug"
        >
          {formError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full text-[15px]"
      >
        {isPending && (
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        )}
        {isPending ? "Sending…" : "Continue with email"}
      </Button>
    </form>
  );
};

export default SignInForm;
