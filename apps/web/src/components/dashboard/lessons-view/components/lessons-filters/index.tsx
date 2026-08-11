"use client";

import { useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, isPlainClick } from "@/lib/utils";
import { dashboardHref } from "@/lib/routes";
import { FILTERS, type LessonFilter } from "../../helpers/constants";
import LessonsSearch from "../lessons-search";
import LessonsPagination from "../lessons-pagination";

interface Props {
  status: LessonFilter;
  q: string;
  total: number;
  page: number;
  totalPages: number;
  children: ReactNode;
}

const LessonsFilters = ({
  status,
  q,
  total,
  page,
  totalPages,
  children,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (href: string) => startTransition(() => router.push(href));

  return (
    <div className="px-6 py-5 md:px-10 md:pb-10">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <LessonsSearch initialQuery={q} status={status} onNavigate={navigate} />
        {FILTERS.map((filter) => {
          const active = filter.value === status;
          const href = dashboardHref({ status: filter.value, q });
          return (
            <Link
              key={filter.value}
              href={href}
              onClick={(event) => {
                if (!isPlainClick(event)) return;
                event.preventDefault();
                navigate(href);
              }}
              aria-current={active ? "true" : undefined}
              className={cn(
                "inline-flex h-7.5 items-center rounded-full border px-3 text-[12.5px] font-medium no-underline transition-colors",
                "focus-visible:ring-accent-brand/60 outline-none focus-visible:ring-2",
                active
                  ? "border-accent-soft-border bg-accent-soft text-accent-brand"
                  : "border-border-subtle text-text-secondary hover:text-text-primary",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
        <div className="flex-1" />

        <span
          role="status"
          aria-live="polite"
          className="text-text-tertiary text-[12.5px]"
        >
          {isPending ? (
            <span className="edu-pending">Updating…</span>
          ) : (
            `${total} ${total === 1 ? "lesson" : "lessons"}`
          )}
        </span>
      </div>

      <div
        aria-busy={isPending}
        className={cn(
          "transition-opacity duration-200",
          isPending && "pointer-events-none opacity-60",
        )}
      >
        {children}

        {totalPages > 1 && (
          <LessonsPagination
            page={page}
            totalPages={totalPages}
            status={status}
            q={q}
            onNavigate={navigate}
          />
        )}
      </div>
    </div>
  );
};

export default LessonsFilters;
