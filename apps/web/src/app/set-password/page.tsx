import type { Metadata } from "next";
import Link from "next/link";
import type { PublicUser } from "@educatio/shared";
import AuthShell from "@/components/auth/auth-shell";
import Card from "@/components/ui/card";
import SetPasswordForm from "@/components/auth/set-password-form";
import { api } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Set password",
};

const SetPasswordPage = async () => {
  let hasPassword = false;
  try {
    const { user } = await api.get<{ user: PublicUser }>("/auth/me");
    hasPassword = user?.hasPassword ?? false;
  } catch (error) {
    console.error("set-password: /auth/me failed", error);
  }

  return (
    <AuthShell>
      <Card padding={32}>
        <h1 className="text-text-primary text-[22px] font-semibold tracking-[-0.02em]">
          {hasPassword ? "Change your password" : "Set password"}
        </h1>
        <p className="text-text-secondary mt-2 mb-6 text-sm leading-normal">
          {hasPassword
            ? "Update the password you use to sign in."
            : "Add a password so you can sign in without a magic link next time — or skip and keep using magic links."}
        </p>

        <SetPasswordForm hasPassword={hasPassword} />

        <p className="border-border-subtle mt-5.5 border-t pt-4.5 text-center text-[13px]">
          <Link
            href="/dashboard"
            className="text-text-secondary font-medium no-underline"
          >
            {hasPassword ? "Back to dashboard" : "Skip for now"}
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
};

export default SetPasswordPage;
