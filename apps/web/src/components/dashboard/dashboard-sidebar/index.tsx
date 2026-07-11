"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import Wordmark from "@/components/brand/wordmark";
import Avatar from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./helpers/constants";

interface Props {
  name: string;
  email: string;
}

const DashboardSidebar = ({ name, email }: Props) => {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const signOut = () =>
    startTransition(async () => {
      try {
        await fetch("/auth/signout", { method: "POST" });
      } catch (error) {
        console.error("sign-out request failed", error);
      }
      window.location.assign("/");
    });

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <aside className="border-border-subtle bg-bg hidden w-60 shrink-0 flex-col border-r px-3.5 py-5 md:sticky md:top-0 md:flex md:h-dvh">
        <div className="px-2 pb-6">
          <Wordmark href="/dashboard" size={14} />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] tracking-[-0.005em] no-underline transition-colors",
                  "focus-visible:ring-accent-brand/60 outline-none focus-visible:ring-2",
                  active
                    ? "bg-surface text-text-primary font-medium shadow-(--shadow-subtle)"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    active ? "text-accent-brand" : "text-text-tertiary",
                  )}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-border-subtle mt-3 flex items-center gap-2.5 border-t px-2 pt-3.5">
          <Avatar name={name} color="var(--accent-brand)" size={28} />
          <div className="min-w-0 flex-1">
            <div className="text-text-primary truncate text-[13px] font-medium tracking-[-0.005em]">
              {name}
            </div>
            {email && (
              <div className="text-text-tertiary truncate text-[11.5px]">
                {email}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={pending}
            aria-label="Sign out"
            title="Sign out"
            className="text-text-tertiary hover:text-text-secondary focus-visible:ring-accent-brand/60 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
          >
            <LogOutIcon
              className="size-3.75"
              strokeWidth={1.7}
              aria-hidden="true"
            />
          </button>
        </div>
      </aside>

      <header className="border-border-subtle bg-bg flex items-center justify-between border-b px-5 py-3 md:hidden">
        <Wordmark href="/dashboard" size={14} />
        <div className="flex items-center gap-2.5">
          <Avatar name={name} color="var(--accent-brand)" size={28} />
          <button
            type="button"
            onClick={signOut}
            disabled={pending}
            aria-label="Sign out"
            title="Sign out"
            className="text-text-tertiary hover:text-text-secondary focus-visible:ring-accent-brand/60 flex size-10 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
          >
            <LogOutIcon
              className="size-4"
              strokeWidth={1.7}
              aria-hidden="true"
            />
          </button>
        </div>
      </header>
    </>
  );
};

export default DashboardSidebar;
