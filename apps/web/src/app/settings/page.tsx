import type { Metadata } from "next";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import ProfileForm from "@/components/settings/profile-form";
import DeleteAccountButton from "@/components/settings/delete-account-button";
import { ButtonLink } from "@/components/ui/button";
import LoadFailure from "@/components/ui/load-failure";
import { fetchCurrentUser } from "@/lib/api-auth";
import { query } from "@/lib/api-error";
import { requireTutor } from "@/lib/session-server";
import SettingsSection from "@/components/settings/settings-section";

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
        <LoadFailure
          title="We couldn't load your account"
          code={me.code}
          retryHref="/settings"
        />
      ) : (
        <div className="flex max-w-140 flex-col gap-5 p-6 md:p-10">
          {user.isDemo && (
            <p className="border-accent-soft-border bg-accent-tint text-text-secondary rounded-[10px] border px-4 py-3.5 text-[13px] leading-normal">
              This is a demo account. It works like any other, but it and its
              lessons are deleted after 24 hours.
            </p>
          )}

          <SettingsSection
            title="Profile"
            description="Your email and display name."
          >
            <div className="mb-4">
              <p className="text-text-primary mb-1.5 text-[13px] font-medium tracking-[-0.005em]">
                Email
              </p>
              <p className="text-text-secondary text-sm tracking-[-0.005em] wrap-anywhere">
                {user.email}
              </p>
            </div>

            <ProfileForm name={user.name} />
          </SettingsSection>

          <SettingsSection
            title="Password"
            description={
              user.hasPassword
                ? "Sign in with a password as well as a magic link."
                : "You sign in by magic link. Add a password for a faster way in."
            }
          >
            <ButtonLink
              href="/set-password?next=/settings"
              variant="outline"
              size="form"
            >
              {user.hasPassword ? "Change password" : "Set password"}
            </ButtonLink>
          </SettingsSection>

          <SettingsSection
            title="Delete account"
            description="Removes your account and every lesson, canvas and summary in it. This can't be undone."
          >
            <DeleteAccountButton email={user.email} />
          </SettingsSection>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SettingsPage;
