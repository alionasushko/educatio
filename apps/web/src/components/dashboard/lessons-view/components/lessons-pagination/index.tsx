"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn, isPlainClick } from "@/lib/utils";
import type { LessonFilter } from "../../helpers/constants";
import { dashboardHref } from "@/lib/routes";

interface Props {
  page: number;
  totalPages: number;
  status: LessonFilter;
  q: string;
  onNavigate: (href: string) => void;
}

const LessonsPagination = ({
  page,
  totalPages,
  status,
  q,
  onNavigate,
}: Props) => {
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  const sizing = "h-8 gap-1 px-3 text-[13px]";
  const disabledCls = "text-text-tertiary pointer-events-none opacity-50";

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    onNavigate(href);
  };

  const prevHref = dashboardHref({ status, q, page: page - 1 });
  const nextHref = dashboardHref({ status, q, page: page + 1 });

  return (
    <div className="mt-5 flex items-center justify-between">
      <span className="text-text-tertiary text-[12.5px]">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <ButtonLink
          variant="outline"
          href={prevHref}
          onClick={(event) => handleClick(event, prevHref)}
          aria-disabled={prevDisabled}
          tabIndex={prevDisabled ? -1 : undefined}
          className={cn(sizing, prevDisabled && disabledCls)}
        >
          <ChevronLeftIcon className="size-3.5" aria-hidden="true" />
          Previous
        </ButtonLink>
        <ButtonLink
          variant="outline"
          href={nextHref}
          onClick={(event) => handleClick(event, nextHref)}
          aria-disabled={nextDisabled}
          tabIndex={nextDisabled ? -1 : undefined}
          className={cn(sizing, nextDisabled && disabledCls)}
        >
          Next
          <ChevronRightIcon className="size-3.5" aria-hidden="true" />
        </ButtonLink>
      </div>
    </div>
  );
};

export default LessonsPagination;
