import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import AuthLayout from "@/components/auth/auth-layout";
import AuthHeading from "@/components/auth/auth-heading";
import SignInForm from "@/components/auth/sign-in-form";
import TryDemoButton from "@/components/auth/try-demo-button";
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
    <AuthLayout>
      <Card padding={32}>
        <AuthHeading title="Sign in to Educatio">
          Welcome back — sign in with your password.
        </AuthHeading>

        <Suspense fallback={null}>
          <AuthErrorBanner />
        </Suspense>

        <SignInForm callbackUrl={target} />

        <div className="my-5 flex items-center gap-3">
          <span className="bg-border h-px flex-1" />
          <span className="text-text-tertiary text-xs">or</span>
          <span className="bg-border h-px flex-1" />
        </div>

        <TryDemoButton />

        <p className="border-border-subtle text-text-secondary mt-5.5 border-t pt-4.5 text-center text-[13px] leading-normal">
          New to Educatio? <Link href="/sign-up">Create a tutor account</Link>
        </p>
      </Card>
    </AuthLayout>
  );
};

export default SignInPage;
