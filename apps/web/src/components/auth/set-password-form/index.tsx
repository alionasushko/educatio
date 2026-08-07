"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, Loader2Icon } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { setPasswordSchema } from "@educatio/shared/api/auth";
import { setPasswordAction } from "@/app/set-password/actions";

interface Props {
  hasPassword: boolean;
}

const SetPasswordForm = ({ hasPassword }: Props) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setDone(false);

    const parsed = setPasswordSchema.safeParse({ password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Choose a valid password.");
      return;
    }

    startTransition(async () => {
      const result = await setPasswordAction(password);
      if (!result.ok) {
        setError(result.fieldErrors?.password ?? result.error);
        return;
      }
      setDone(true);
      setPassword("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Input
        label={hasPassword ? "New password" : "Password"}
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setDone(false);
        }}
        error={error}
      />

      {done && (
        <p className="text-accent-brand mb-3 flex items-center gap-1.5 text-[13px]">
          <CheckIcon className="size-4" aria-hidden="true" />
          Password saved — you can sign in with it next time.
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full text-[15px]"
      >
        {isPending && (
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        )}
        {isPending
          ? "Saving…"
          : hasPassword
            ? "Change password"
            : "Set password"}
      </Button>
    </form>
  );
};

export default SetPasswordForm;
