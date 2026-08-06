import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import Card from "@/components/ui/card";
import SetPasswordForm from "@/components/auth/set-password-form";
import { fetchCurrentUser } from "@/lib/api-auth";
import { query } from "@/lib/api-error";

export const metadata: Metadata = {
  title: "Set password",
};

const SetPasswordPage = async () => {
  const me = await query(fetchCurrentUser);
  const hasPassword = me?.user?.hasPassword ?? false;

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
