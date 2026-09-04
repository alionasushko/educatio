import type { Metadata } from "next";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import LessonList from "@/components/dashboard/lesson-list";
import DashboardEmptyState from "@/components/dashboard/dashboard-empty-state";
import NewLessonButton from "@/components/lesson/new-lesson-button";
import LoadFailure from "@/components/ui/load-failure";
import TimezoneBootstrap from "@/components/timezone-bootstrap";
import { fetchCurrentUser } from "@/lib/api-auth";
import { listLessons } from "@/lib/api-lessons";
import { query } from "@/lib/api-error";
import { requireTutor } from "@/lib/session-server";
import { dashboardHref } from "@/lib/routes";
import { readTimeZone } from "@/lib/timezone-server";
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

  const currentHref = dashboardHref({ status, q, page });

  await requireTutor(currentHref);

  const { raw: rawTimeZone, timeZone } = await readTimeZone();

  const [me, lessons] = await Promise.all([
    query(fetchCurrentUser),
    query(() =>
      listLessons({ page, limit: LESSONS_PER_PAGE, status, q: q || undefined }),
    ),
  ]);
  const user = me.data?.user ?? null;
  const data = lessons.data;

  const isEmpty = data !== null && data.total === 0 && status === "all" && !q;
  const subtitle = isEmpty
    ? "No lessons yet — create your first below."
    : "Recent and active sessions.";

  return (
    <>
      <TimezoneBootstrap current={rawTimeZone} />
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
              Lessons
            </h1>
            <p className="text-text-secondary mt-1 text-[13.5px]">{subtitle}</p>
          </>
        }
        action={<NewLessonButton />}
      >
        {data === null ? (
          <LoadFailure
            title="We couldn't load your lessons"
            code={lessons.code}
            retryHref={currentHref}
          />
        ) : isEmpty ? (
          <DashboardEmptyState />
        ) : (
          <LessonList
            lessons={data.lessons}
            total={data.total}
            page={data.page}
            totalPages={data.totalPages}
            status={status}
            q={q}
            timeZone={timeZone}
          />
        )}
      </DashboardLayout>
    </>
  );
};

export default DashboardPage;
