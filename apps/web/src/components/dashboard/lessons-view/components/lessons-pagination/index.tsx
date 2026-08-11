import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LessonFilter } from "../../helpers/constants";
import { dashboardHref } from "@/lib/routes";

interface Props {
  page: number;
  totalPages: number;
  status: LessonFilter;
  q: string;
}

const LessonsPagination = ({ page, totalPages, status, q }: Props) => {
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  const linkCls = cn(
    buttonVariants({ variant: "outline" }),
    "h-8 gap-1 px-3 text-[13px]",
  );
  const disabledCls = "text-text-tertiary pointer-events-none opacity-50";

  return (
    <div className="mt-5 flex items-center justify-between">
      <span className="text-text-tertiary text-[12.5px]">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={dashboardHref({ status, q, page: page - 1 })}
          aria-disabled={prevDisabled}
          tabIndex={prevDisabled ? -1 : undefined}
          className={cn(linkCls, prevDisabled && disabledCls)}
        >
          <ChevronLeftIcon className="size-3.5" aria-hidden="true" />
          Previous
        </Link>
        <Link
          href={dashboardHref({ status, q, page: page + 1 })}
          aria-disabled={nextDisabled}
          tabIndex={nextDisabled ? -1 : undefined}
          className={cn(linkCls, nextDisabled && disabledCls)}
        >
          Next
          <ChevronRightIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

export default LessonsPagination;
