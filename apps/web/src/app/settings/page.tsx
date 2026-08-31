import type { Metadata } from "next";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import ProfileForm from "@/components/settings/profile-form";
import DeleteAccountButton from "@/components/settings/delete-account-button";
import Card from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { fetchCurrentUser } from "@/lib/api-auth";
import { query } from "@/lib/api-error";
import { ERROR_COPY } from "@/lib/error-messages";
import { requireTutor } from "@/lib/session-server";

export const metadata: Metadata = {
  title: "Settings",
};

const SettingsPage = async () => {
  await requireTutor("/settings");

  const me = await query(fetchCurrentUser);
  const user = me.data?.user ?? null;

  return (
    <DashboardLayout
      sidebar={
        <DashboardSidebar
          name={user?.name ?? "Tutor"}
          email={user?.email ?? ""}
        />
      }
      heading={
        <>
          <h1 className="text-text-primary text-[26px] font-semibold tracking-tight">
            Settings
          </h1>
          <p className="text-text-secondary mt-1 text-[13.5px]">
            Your account and how you sign in.
          </p>
        </>
      }
    >
      {user === null ? (
        <div className="flex h-full items-center justify-center p-10">
          <div className="max-w-90 text-center">
            <p className="text-text-primary text-base font-medium">
              We couldn&apos;t load your account
            </p>
            <p className="text-text-tertiary mt-1 text-sm">
              {ERROR_COPY[me.code ?? "internal_error"]}
            </p>
            <ButtonLink
              href="/settings"
              variant="outline"
              className="mt-4 h-9 px-4 text-sm"
            >
              Retry
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="flex max-w-140 flex-col gap-5 p-6 md:p-10">
          <Card padding={24}>
            <h2 className="text-text-primary text-[15px] font-medium">
              Profile
            </h2>
            <p className="text-text-secondary mt-1 mb-5 text-[13px]">
              Your email and display name.
            </p>

            <div className="mb-4">
              <p className="text-text-primary mb-1.5 text-[13px] font-medium tracking-[-0.005em]">
                Email
              </p>
              <p className="text-text-secondary text-sm tracking-[-0.005em]">
                {user.email}
              </p>
            </div>

            <ProfileForm name={user.name} />
          </Card>

          <Card padding={24}>
            <h2 className="text-text-primary text-[15px] font-medium">
              Password
            </h2>
            <p className="text-text-secondary mt-1 mb-4 text-[13px]">
              {user.hasPassword
                ? "Sign in with a password as well as a magic link."
                : "You sign in by magic link. Add a password for a faster way in."}
            </p>
            <ButtonLink
              href="/set-password?next=/settings"
              variant="outline"
              className="h-10 px-4 text-sm"
            >
              {user.hasPassword ? "Change password" : "Set a password"}
            </ButtonLink>
          </Card>

          <Card padding={24}>
            <h2 className="text-text-primary text-[15px] font-medium">
              Delete account
            </h2>
            <p className="text-text-secondary mt-1 mb-4 text-[13px]">
              Removes your account and every lesson, canvas and summary in it.
              This can&apos;t be undone.
            </p>
            <DeleteAccountButton email={user.email} />
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SettingsPage;
