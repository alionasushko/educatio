import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import AuthShell from "@/components/auth/auth-shell";
import SignUpForm from "@/components/auth/sign-up-form";
import TryDemoButton from "@/components/auth/try-demo-button";
import AuthErrorBanner from "@/components/auth/auth-error-banner";
import Card from "@/components/ui/card";
import Eyebrow from "@/components/ui/eyebrow";
import { redirectSignedInTutor } from "@/lib/session-server";

export const metadata: Metadata = {
  title: "Create your tutor account",
};

const SignUpPage = async () => {
  await redirectSignedInTutor();

  return (
    <AuthShell
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-accent-brand font-medium no-underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <Card padding={32}>
        <Eyebrow>For tutors</Eyebrow>
        <h1 className="text-text-primary mt-2.5 text-2xl font-semibold tracking-[-0.02em]">
          Create your tutor account
        </h1>
        <p className="text-text-secondary mt-2 mb-6 text-sm leading-normal">
          Free for solo tutors — unlimited lessons, no card needed. Setup takes
          30 seconds.
        </p>

        <Suspense fallback={null}>
          <AuthErrorBanner />
        </Suspense>

        <SignUpForm />

        <div className="my-5 flex items-center gap-3">
          <span className="bg-border h-px flex-1" />
          <span className="text-text-tertiary text-xs">or</span>
          <span className="bg-border h-px flex-1" />
        </div>

        <TryDemoButton />

        <p className="text-text-tertiary mt-4 text-center text-xs leading-snug">
          By creating an account you agree to our{" "}
          <a href="#" className="text-text-secondary">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="text-text-secondary">
            Privacy Policy
          </a>
          .
        </p>
      </Card>

      <div className="border-accent-soft-border bg-accent-tint mt-4.5 flex items-start gap-3 rounded-[10px] border px-4 py-3.5">
        <div className="bg-accent-brand text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
          <CheckIcon className="size-4" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <p className="text-text-secondary text-[13px] leading-normal">
          <span className="text-text-primary font-medium">
            Are you a student?
          </span>{" "}
          You don’t need an account — just open the lesson link your tutor sent.
        </p>
      </div>
    </AuthShell>
  );
};

export default SignUpPage;
