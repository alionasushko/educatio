"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { updateProfileSchema } from "@educatio/shared/api/auth";
import { updateNameAction } from "@/app/settings/actions";

interface Props {
  name: string;
  readOnly?: boolean;
}

const ProfileForm = ({ name: initialName, readOnly = false }: Props) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const unchanged = name.trim() === initialName.trim();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);

    const parsed = updateProfileSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter your name.");
      return;
    }

    startTransition(async () => {
      const result = await updateNameAction(parsed.data.name);
      if (!result.ok) {
        setError(result.fieldErrors?.name ?? result.error);
        return;
      }
      setName(parsed.data.name);
      toast.success("Name updated");
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Input
        label="Name"
        name="name"
        autoComplete="name"
        helper="The name your students see on the whiteboard."
        disabled={readOnly}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
        }}
        error={error}
      />

      <Button
        type="submit"
        disabled={isPending || unchanged || readOnly}
        className="mt-4 h-10 px-4 text-sm"
      >
        {isPending && (
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        )}
        {isPending ? "Saving…" : "Save name"}
      </Button>
    </form>
  );
};

export default ProfileForm;
