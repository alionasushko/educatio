import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import LessonsView from "@/components/dashboard/lessons-view";
import DashboardEmptyState from "@/components/dashboard/dashboard-empty-state";
import NewLessonButton from "@/components/lesson/new-lesson-button";
import TimezoneBootstrap from "@/components/timezone-bootstrap";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchCurrentUser } from "@/lib/api-auth";
import { listLessons } from "@/lib/api-lessons";
import { query } from "@/lib/api-error";
import { TIMEZONE_COOKIE, safeTimeZone } from "@/lib/timezone";
import { LESSONS_PER_PAGE } from "./helpers/constants";
import { parsePage, parseQuery, parseStatus } from "./helpers/helpers";

export const metadata: Metadata = {
  title: "Lessons",
};

interface Props {
  searchParams: Promise<{
    page?: string | string[];
    status?: string | string[];
    q?: string | string[];
  }>;
}

const DashboardPage = async ({ searchParams }: Props) => {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const status = parseStatus(sp.status);
  const q = parseQuery(sp.q);

  const timeZone = safeTimeZone((await cookies()).get(TIMEZONE_COOKIE)?.value);

  const me = await query(fetchCurrentUser);
  const user = me?.user ?? null;

  const data = await query(() =>
    listLessons({ page, limit: LESSONS_PER_PAGE, status, q: q || undefined }),
  );

  const isEmpty = data !== null && data.total === 0 && status === "all" && !q;
  const subtitle = isEmpty
    ? "No lessons yet — create your first below."
    : "Recent and active sessions.";

  const retryParams = new URLSearchParams();
  if (status !== "all") retryParams.set("status", status);
  if (q) retryParams.set("q", q);
  if (page > 1) retryParams.set("page", String(page));
  const retryHref = retryParams.toString()
    ? `/dashboard?${retryParams.toString()}`
    : "/dashboard";

  return (
    <div className="bg-bg min-h-dvh md:flex">
      <TimezoneBootstrap current={timeZone} />
      <DashboardSidebar
        name={user?.name ?? "Tutor"}
        email={user?.email ?? ""}
      />

      <main className="bg-surface flex min-w-0 flex-1 flex-col">
        <header className="border-border-subtle flex items-end justify-between gap-6 border-b px-6 py-6 md:px-10 md:pt-7 md:pb-5">
          <div className="min-w-0">
            <h1 className="text-text-primary text-[26px] font-semibold tracking-tight">
              Lessons
            </h1>
            <p className="text-text-secondary mt-1 text-[13.5px]">{subtitle}</p>
          </div>
          <NewLessonButton />
        </header>

        <div className="bg-bg flex-1 overflow-auto">
          {data === null ? (
            <div className="flex h-full items-center justify-center p-10">
              <div className="max-w-90 text-center">
                <p className="text-text-primary text-base font-medium">
                  We couldn&apos;t load your lessons
                </p>
                <p className="text-text-tertiary mt-1 text-sm">
                  Something went wrong on our end. Please try again.
                </p>
                <Link
                  href={retryHref}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-4 h-9 px-4 text-sm",
                  )}
                >
                  Retry
                </Link>
              </div>
            </div>
          ) : isEmpty ? (
            <DashboardEmptyState />
          ) : (
            <LessonsView
              lessons={data.lessons}
              total={data.total}
              page={data.page}
              totalPages={data.totalPages}
              status={status}
              q={q}
              timeZone={timeZone}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
