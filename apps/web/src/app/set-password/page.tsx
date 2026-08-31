import Link from "next/link";
import type { Metadata } from "next";
import AuthShell from "@/components/auth/auth-shell";
import Card from "@/components/ui/card";
import SetPasswordForm from "@/components/auth/set-password-form";
import { fetchCurrentUser } from "@/lib/api-auth";
import { query } from "@/lib/api-error";
import { requireTutor } from "@/lib/session-server";
import { safeInternalPath } from "@/lib/request";

export const metadata: Metadata = {
  title: "Set password",
};

interface Props {
  searchParams: Promise<{ next?: string | string[] }>;
}

const SetPasswordPage = async ({ searchParams }: Props) => {
  const raw = (await searchParams).next;
  const next =
    safeInternalPath(Array.isArray(raw) ? raw[0] : raw) ?? "/dashboard";

  await requireTutor(`/set-password?next=${encodeURIComponent(next)}`);

  const me = await query(fetchCurrentUser);
  const hasPassword = me.data?.user.hasPassword ?? false;

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

        <SetPasswordForm hasPassword={hasPassword} next={next} />

        <p className="border-border-subtle mt-5.5 border-t pt-4.5 text-center text-[13px]">
          <Link href={next} className="link-muted">
            {hasPassword
              ? next === "/settings"
                ? "Back to settings"
                : "Back to dashboard"
              : "Skip for now"}
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
};

export default SetPasswordPage;
