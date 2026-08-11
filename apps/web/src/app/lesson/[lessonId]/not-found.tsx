import type { Metadata } from "next";
import MessageScreen from "@/components/ui/message-screen";

export const metadata: Metadata = {
  title: "Lesson not found",
};

const LessonNotFound = () => (
  <MessageScreen
    title="We couldn't find that lesson"
    body="It may have been deleted, or you may not have access to it."
    href="/dashboard"
    linkLabel="Back to dashboard"
  />
);

export default LessonNotFound;
