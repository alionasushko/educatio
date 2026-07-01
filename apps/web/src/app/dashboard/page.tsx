import type { Metadata } from "next";
import type { PublicUser } from "@educatio/shared";
import Wordmark from "@/components/brand/wordmark";
import SignOutButton from "@/components/auth/sign-out-button";
import Card from "@/components/ui/card";
import { api } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Dashboard",
};

const DashboardPage = async () => {
  let name = "there";
  try {
    const { user } = await api.get<{ user: PublicUser }>("/auth/me");
    if (user?.name) name = user.name;
  } catch (error) {
    console.error("dashboard: /auth/me failed", error);
  }

  return (
    <div className="bg-bg flex min-h-dvh flex-col">
      <header className="border-border-subtle flex items-center justify-between border-b px-6 py-4 md:px-12">
        <Wordmark href="/" size={15} />
        <SignOutButton />
      </header>

      <main className="mx-auto flex w-full max-w-300 flex-1 flex-col px-6 py-12 md:px-12">
        <h1 className="text-text-primary text-2xl font-semibold tracking-[-0.02em]">
          Welcome, {name}
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          Your lessons will show up here once the dashboard is built.
        </p>

        <Card className="mt-8 text-center" padding={48}>
          <p className="text-text-primary text-base font-medium">
            No lessons yet
          </p>
          <p className="text-text-tertiary mt-1 text-sm">
            This is a placeholder while the full dashboard is in progress.
          </p>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;
