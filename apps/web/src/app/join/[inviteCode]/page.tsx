import type { Metadata } from "next";
import Wordmark from "@/components/brand/wordmark";
import JoinLessonForm from "@/components/lesson/join-lesson-form";
import { getCurrentSession } from "@/lib/session-server";

export const metadata: Metadata = {
  title: "Join lesson",
};

interface Props {
  params: Promise<{ inviteCode: string }>;
}

const JoinLessonPage = async ({ params }: Props) => {
  const { inviteCode } = await params;
  const session = await getCurrentSession();

  return (
    <div className="bg-bg flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-105">
        <div className="mb-6 flex justify-center">
          <Wordmark size={16} />
        </div>
        <div className="border-border-subtle bg-surface rounded-[14px] border p-7 shadow-(--shadow-large)">
          <JoinLessonForm
            inviteCode={inviteCode}
            tutorEmail={session?.kind === "tutor" ? session.email : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default JoinLessonPage;
