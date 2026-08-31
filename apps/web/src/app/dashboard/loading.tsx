import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { SIDEBAR_FRAME } from "@/components/dashboard/dashboard-sidebar/helpers/constants";
import { LESSON_GRID } from "@/components/dashboard/lessons-view/helpers/constants";

const ROWS = 6;

const DashboardLoading = () => (
  <DashboardLayout
    sidebar={<div className={SIDEBAR_FRAME} />}
    heading={
      <>
        <div className="edu-shimmer h-7 w-40 rounded-md" />
        <div className="edu-shimmer mt-2.5 h-4 w-56 rounded" />
      </>
    }
    action={<div className="edu-shimmer h-10 w-32 rounded-lg" />}
  >
    <div className="px-6 py-5 md:px-10 md:pb-10">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="edu-shimmer h-8 w-full rounded-lg sm:w-70" />
        <div className="edu-shimmer h-7.5 w-14 rounded-full" />
        <div className="edu-shimmer h-7.5 w-18 rounded-full" />
        <div className="edu-shimmer h-7.5 w-16 rounded-full" />
      </div>

      <div
        className="border-border-subtle bg-surface overflow-hidden rounded-xl border"
        aria-hidden="true"
      >
        {Array.from({ length: ROWS }, (_, i) => (
          <div
            key={i}
            className={`${LESSON_GRID} ${
              i < ROWS - 1 ? "border-border-subtle border-b" : ""
            } px-5 py-4`}
          >
            <div className="edu-shimmer h-4 w-3/4 rounded" />
            <div className="edu-shimmer h-4 w-20 rounded" />
            <div className="edu-shimmer h-4 w-24 rounded" />
            <div className="edu-shimmer h-5 w-16 rounded-full" />
            <div className="edu-shimmer size-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>

    <span className="sr-only" role="status">
      Loading your lessons
    </span>
  </DashboardLayout>
);

export default DashboardLoading;
