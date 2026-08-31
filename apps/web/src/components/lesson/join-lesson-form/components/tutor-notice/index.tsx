"use client";

import Button, { ButtonLink } from "@/components/ui/button";

interface Props {
  email: string;
  onContinue: () => void;
}

const TutorNotice = ({ email, onContinue }: Props) => (
  <>
    <h1 className="text-text-primary text-[19px] font-semibold tracking-[-0.015em]">
      You&apos;re already signed in
    </h1>
    <p className="text-text-secondary mt-1.5 text-[13.5px] leading-normal">
      This device is signed in as <span className="font-medium">{email}</span>.
      Joining as a student signs you out of that account here — your own lessons
      stay safe, you&apos;d just sign back in to reach them.
    </p>

    <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
      <ButtonLink href="/dashboard" className="h-10 flex-1 px-4 text-sm">
        Back to my dashboard
      </ButtonLink>
      <Button
        type="button"
        variant="outline"
        onClick={onContinue}
        className="h-10 flex-1 px-4 text-sm"
      >
        Join as a student
      </Button>
    </div>
  </>
);

export default TutorNotice;
