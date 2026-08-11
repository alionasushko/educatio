import type { ReactNode } from "react";

interface Props {
  sidebar: ReactNode;
  heading: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

const DashboardLayout = ({ sidebar, heading, action, children }: Props) => (
  <div className="bg-bg min-h-dvh md:flex">
    {sidebar}

    <main className="bg-surface flex min-w-0 flex-1 flex-col">
      <header className="border-border-subtle flex items-end justify-between gap-6 border-b px-6 py-6 md:px-10 md:pt-7 md:pb-5">
        <div className="min-w-0">{heading}</div>
        {action}
      </header>

      <div className="bg-bg flex-1 overflow-auto">{children}</div>
    </main>
  </div>
);

export default DashboardLayout;
