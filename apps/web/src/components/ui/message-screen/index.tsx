import type { ReactNode } from "react";
import Wordmark from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";

interface Props {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
  action?: ReactNode;
}

const MessageScreen = ({ title, body, href, linkLabel, action }: Props) => (
  <div className="bg-bg flex min-h-dvh flex-col">
    <header className="flex items-center px-6 py-4 md:px-10">
      <Wordmark href="/" size={14} />
    </header>

    <main className="flex flex-1 items-center justify-center px-6 pb-20">
      <div className="max-w-105 text-center">
        <h1 className="text-text-primary text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-text-secondary mt-2.5 text-sm leading-relaxed">
          {body}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {action}
          <ButtonLink
            href={href}
            variant="outline"
            className="h-10 px-4 text-sm"
          >
            {linkLabel}
          </ButtonLink>
        </div>
      </div>
    </main>
  </div>
);

export default MessageScreen;
