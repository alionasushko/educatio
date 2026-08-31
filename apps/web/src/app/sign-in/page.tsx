import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "@/components/auth/auth-shell";
import SignInForm from "@/components/auth/sign-in-form";
import AuthErrorBanner from "@/components/auth/auth-error-banner";
import Card from "@/components/ui/card";
import { redirectSignedInTutor } from "@/lib/session-server";
import { safeInternalPath } from "@/lib/request";

export const metadata: Metadata = {
  title: "Sign in",
};

interface Props {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}

const SignInPage = async ({ searchParams }: Props) => {
  const { callbackUrl } = await searchParams;
  const target = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;
  await redirectSignedInTutor(safeInternalPath(target) ?? "/dashboard");

  return (
    <AuthShell>
      <Card padding={32}>
        <h1 className="text-text-primary text-[22px] font-semibold tracking-[-0.02em]">
          Sign in to Educatio
        </h1>
        <p className="text-text-secondary mt-2 mb-6 text-sm leading-normal">
          Welcome back — sign in with your password.
        </p>

        <Suspense fallback={null}>
          <AuthErrorBanner />
        </Suspense>

        <SignInForm callbackUrl={target} />

        <p className="border-border-subtle text-text-secondary mt-5.5 border-t pt-4.5 text-center text-[13px] leading-normal">
          New to Educatio? <Link href="/sign-up">Create a tutor account</Link>
        </p>
      </Card>
    </AuthShell>
  );
};

export default SignInPage;
