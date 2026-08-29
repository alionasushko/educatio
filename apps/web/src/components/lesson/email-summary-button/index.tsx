"use client";

import { MailIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toPlainText } from "@/lib/summary-markdown";

interface Props {
  lessonTitle: string;
  studentEmail?: string;
  summary: string;
}

const EmailSummaryButton = ({ lessonTitle, studentEmail, summary }: Props) => {
  const body = toPlainText(summary);

  const href = `mailto:${studentEmail ? encodeURIComponent(studentEmail) : ""}?subject=${encodeURIComponent(
    `Lesson summary: ${lessonTitle}`,
  )}&body=${encodeURIComponent(body)}`;

  return (
    <a
      href={href}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "h-9 gap-1.5 px-3 text-sm no-underline",
      )}
    >
      <MailIcon className="size-4" aria-hidden="true" />
      {studentEmail ? "Email to student" : "Email summary"}
    </a>
  );
};

export default EmailSummaryButton;
