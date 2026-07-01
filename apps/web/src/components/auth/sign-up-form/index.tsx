"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { signupAction } from "@/app/sign-up/actions";
import { validate } from "./helpers/helpers";
import { FIELD_ORDER } from "./helpers/constants";
import type { Errors, Field } from "./helpers/types";

const SignUpForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [teaches, setTeaches] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const values: Record<Field, string> = { name, email, teaches };

  const errorFor = (field: Field) =>
    submitted || touched[field] ? errors[field] : undefined;

  const handleBlur = (field: Field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setFormError(null);

    const next = validate(values);
    setErrors(next);
    const firstInvalid = FIELD_ORDER.find((field) => next[field]);
    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)
        ?.focus();
      return;
    }

    startTransition(async () => {
      const result = await signupAction({
        name: name.trim(),
        email: email.trim(),
        teaches: teaches.trim() || undefined,
      });
      if (result?.error) setFormError(result.error);
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="mb-4.5 flex flex-col gap-3.5">
        <Input
          label="Your name"
          name="name"
          autoComplete="name"
          autoFocus
          placeholder="Sara Martínez"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => handleBlur("name")}
          error={errorFor("name")}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@school.com"
          helper="We'll send a magic link — no password needed."
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => handleBlur("email")}
          error={errorFor("email")}
        />
        <Input
          label="What do you teach?"
          name="teaches"
          placeholder="Spanish, GCSE Maths, piano…"
          helper="Optional. Helps us tailor your lesson templates."
          value={teaches}
          onChange={(event) => setTeaches(event.target.value)}
          onBlur={() => handleBlur("teaches")}
          error={errorFor("teaches")}
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

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="h-12 w-full text-[15px]"
      >
        {isPending && (
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        )}
        {isPending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
};

export default SignUpForm;
