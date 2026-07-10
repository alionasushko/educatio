import type { Metadata } from "next";
import Link from "next/link";
import { MailIcon } from "lucide-react";
import AuthShell from "@/components/auth/auth-shell";
import Card from "@/components/ui/card";
import ResendLink from "@/components/auth/resend-link";
import SessionWatcher from "@/components/auth/session-watcher";

export const metadata: Metadata = {
  title: "Check your email",
};

interface Props {
  searchParams: Promise<{ email?: string }>;
}

const VerifyPage = async ({ searchParams }: Props) => {
  const { email } = await searchParams;

  return (
    <AuthShell>
      <SessionWatcher />
      <Card padding={32}>
        <div
          className="border-accent-soft-border bg-accent-soft text-accent-brand mb-4.5 flex size-11 items-center justify-center rounded-full border"
          style={{ animation: "edu-pulse-soft 2.6s ease-in-out infinite" }}
        >
          <MailIcon className="size-5" strokeWidth={1.7} aria-hidden="true" />
        </div>

        <h1 className="text-text-primary text-[22px] font-semibold tracking-[-0.02em]">
          Check your email
        </h1>
        <p className="text-text-secondary mt-2 mb-6 text-sm leading-normal">
          We sent a magic link to{" "}
          <span className="text-text-primary font-medium">
            {email || "your email address"}
          </span>
          . Click it to sign in.
        </p>

        <div className="border-border-subtle bg-bg text-text-secondary rounded-sm border px-4 py-3.5 text-[13px] leading-normal">
          The link works for 10 minutes and on one device. Didn’t get it? Make
          sure the address above is spelled correctly, then resend below.
        </div>

        <div className="border-border-subtle mt-5.5 flex items-center justify-between border-t pt-4.5 text-[13px]">
          {email ? (
            <ResendLink email={email} />
          ) : (
            <span className="text-text-tertiary">Resend link</span>
          )}
          <Link
            href="/sign-in"
            className="text-text-secondary font-medium no-underline"
          >
            Use a different email
          </Link>
        </div>

        <p className="text-text-tertiary mt-4 text-center text-[13px] leading-normal">
          New to Educatio?{" "}
          <Link
            href="/sign-up"
            className="text-accent-brand font-medium no-underline"
          >
            Create a tutor account
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
};

export default VerifyPage;
