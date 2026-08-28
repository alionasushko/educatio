"use client";

import { useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { studentSessionSchema } from "@educatio/shared/api/sessions";
import { joinLessonAction } from "@/app/join/[inviteCode]/actions";
import TutorNotice from "./components/tutor-notice";

interface Props {
  inviteCode: string;
  tutorEmail?: string;
}

const JoinLessonForm = ({ inviteCode, tutorEmail }: Props) => {
  const [switching, setSwitching] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(undefined);

    const parsed = studentSessionSchema.safeParse({
      inviteCode,
      name: name.trim(),
      email: email.trim(),
    });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setNameError(
        fields.name
          ? "Add your name so your tutor knows who joined."
          : undefined,
      );
      setEmailError(fields.email ? "Enter a valid email address." : undefined);
      return;
    }
    setNameError(undefined);
    setEmailError(undefined);

    startTransition(async () => {
      const result = await joinLessonAction(parsed.data);
      if (!result.ok) setFormError(result.error);
    });
  };

  if (tutorEmail && !switching) {
    return (
      <TutorNotice email={tutorEmail} onContinue={() => setSwitching(true)} />
    );
  }

  return (
    <>
      <h1 className="text-text-primary text-[19px] font-semibold tracking-[-0.015em]">
        Join the lesson
      </h1>
      <p className="text-text-secondary mt-1.5 mb-5.5 text-[13.5px] leading-normal">
        Add your details so your tutor knows who&apos;s on the board and can
        send you the summary afterwards. No account needed.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Your name"
          name="name"
          autoFocus
          maxLength={120}
          placeholder="e.g. Jordan"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
        />

        <div className="mt-4">
          <Input
            label="Your email"
            name="email"
            type="email"
            maxLength={200}
            placeholder="you@example.com"
            helper="Your tutor uses this to send you the lesson summary afterwards."
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
          />
        </div>

        {formError && (
          <p
            role="alert"
            className="text-destructive mt-3 text-[13px] leading-snug"
          >
            {formError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="mt-6 h-10 w-full gap-1.5 px-4 text-sm"
        >
          {isPending && (
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
          )}
          {isPending ? "Joining…" : "Join lesson"}
        </Button>
      </form>
    </>
  );
};

export default JoinLessonForm;
