"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import Input from "@/components/ui/input";
import { setPasswordSchema } from "@educatio/shared/api/auth";
import { setPasswordAction } from "@/app/set-password/actions";

interface Props {
  hasPassword: boolean;
  needsCurrent: boolean;
  next: string;
}

const SetPasswordForm = ({ hasPassword, needsCurrent, next }: Props) => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    currentPassword?: string;
  }>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const parsed = setPasswordSchema.safeParse({ password });
    if (!parsed.success) {
      setErrors({
        password: parsed.error.issues[0]?.message ?? "Choose a valid password.",
      });
      return;
    }

    startTransition(async () => {
      const result = await setPasswordAction(password, currentPassword);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? { password: result.error });
        return;
      }
      toast.success(hasPassword ? "Password changed" : "Password set");
      router.push(next);
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {needsCurrent && (
        <Input
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => {
            setCurrentPassword(event.target.value);
          }}
          error={errors.currentPassword}
        />
      )}

      <Input
        label={hasPassword ? "New password" : "Password"}
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
        }}
        error={errors.password}
      />

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full text-[15px]"
      >
        {isPending && <Spinner />}
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
