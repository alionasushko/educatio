import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import SignInForm from "@/components/auth/sign-in-form";
import AuthErrorBanner from "@/components/auth/auth-error-banner";
import Card from "@/components/ui/card";
import { redirectSignedInTutor } from "@/lib/session-server";

export const metadata: Metadata = {
  title: "Sign in",
};

const SignInPage = async () => {
  await redirectSignedInTutor();

  return (
    <AuthShell>
      <Card padding={32}>
        <h1 className="text-text-primary text-[22px] font-semibold tracking-[-0.02em]">
          Sign in to Educatio
        </h1>
        <p className="text-text-secondary mt-2 mb-6 text-sm leading-normal">
          We’ll email you a magic link — no password needed.
        </p>

        <Suspense fallback={null}>
          <AuthErrorBanner />
        </Suspense>

        <SignInForm />

        <p className="border-border-subtle text-text-secondary mt-5.5 border-t pt-4.5 text-center text-[13px] leading-normal">
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

export default SignInPage;
