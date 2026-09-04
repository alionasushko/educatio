"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import Input from "@/components/ui/input";
import { createLessonSchema } from "@educatio/shared/api/lessons";
import { checkForm, focusField } from "@/lib/form-validation";
import { createLessonAction } from "@/app/lesson/new/actions";

interface Props {
  onCancel?: () => void;
}

const NewLessonForm = ({ onCancel }: Props) => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [studentName, setStudentName] = useState("");
  const [videoCallUrl, setVideoCallUrl] = useState("");
  const [titleError, setTitleError] = useState<string>();
  const [videoError, setVideoError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleCancel = () => {
    if (onCancel) onCancel();
    else router.push("/dashboard");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(undefined);

    const checked = checkForm(
      createLessonSchema,
      {
        title: title.trim(),
        studentName: studentName.trim() || undefined,
        videoCallUrl: videoCallUrl.trim() || undefined,
      },
      {
        title: "Give your lesson a title.",
        videoCallUrl: "Enter a valid link, including https://.",
      },
    );
    setTitleError(checked.ok ? undefined : checked.errors.title);
    setVideoError(checked.ok ? undefined : checked.errors.videoCallUrl);
    if (!checked.ok) {
      if (checked.firstInvalid)
        focusField(formRef.current, checked.firstInvalid);
      return;
    }

    startTransition(async () => {
      const result = await createLessonAction(checked.data);
      if (!result.ok) setFormError(result.error);
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-4">
        <Input
          label="Lesson title"
          name="title"
          autoFocus
          maxLength={200}
          placeholder="e.g. Algebra with Jordan — Week 2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={titleError}
        />
        <Input
          label="Student name"
          name="studentName"
          optional
          maxLength={120}
          placeholder="Will be set when student joins if left blank"
          value={studentName}
          onChange={(event) => setStudentName(event.target.value)}
        />
        <Input
          label="Video call link"
          name="videoCallUrl"
          type="url"
          optional
          placeholder="Paste a Zoom, Meet, or any video link"
          helper="Students can join the call from inside Educatio."
          value={videoCallUrl}
          onChange={(event) => setVideoCallUrl(event.target.value)}
          error={videoError}
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

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          size="form"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} size="form">
          {isPending && <Spinner />}
          {isPending ? "Creating…" : "Create lesson"}
        </Button>
      </div>
    </form>
  );
};

export default NewLessonForm;
