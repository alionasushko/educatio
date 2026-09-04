"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import Input from "@/components/ui/input";
import { studentSessionSchema } from "@educatio/shared/api/sessions";
import { checkForm } from "@/lib/form-validation";
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

    const checked = checkForm(
      studentSessionSchema,
      { inviteCode, name: name.trim(), email: email.trim() },
      {
        name: "Add your name so your tutor knows who joined.",
        email: "Enter a valid email address.",
      },
    );
    setNameError(checked.ok ? undefined : checked.errors.name);
    setEmailError(checked.ok ? undefined : checked.errors.email);
    if (!checked.ok) return;

    startTransition(async () => {
      const result = await joinLessonAction(checked.data);
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
        Add your details so your tutor knows who&apos;s on the canvas and can
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
          size="form"
          className="mt-6 w-full"
        >
          {isPending && <Spinner />}
          {isPending ? "Joining…" : "Join lesson"}
        </Button>
      </form>
    </>
  );
};

export default JoinLessonForm;
