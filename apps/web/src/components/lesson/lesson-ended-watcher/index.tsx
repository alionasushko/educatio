"use client";

import { useRouter } from "next/navigation";
import { useEventListener } from "@liveblocks/react";
import { lessonSummaryHref } from "@/lib/routes";

interface Props {
  lessonId: string;
}

const LessonEndedWatcher = ({ lessonId }: Props) => {
  const router = useRouter();

  useEventListener(({ event }) => {
    if (event.type === "lesson-ended") {
      router.replace(lessonSummaryHref(lessonId));
    }
  });

  return null;
};

export default LessonEndedWatcher;
