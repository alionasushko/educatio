"use client";

import { useEffect } from "react";

import "./globals.css";

interface Props {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

const GlobalError = ({ error, unstable_retry }: Props) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-bg flex min-h-dvh items-center justify-center px-6">
        <title>Something went wrong · Educatio</title>
        <div className="max-w-105 text-center">
          <h1 className="text-text-primary text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-text-secondary mt-2.5 text-sm leading-relaxed">
            The page couldn&apos;t load. Your lessons are safe — try again, or
            reload if that doesn&apos;t help.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="bg-accent-brand focus-visible:ring-accent-brand/60 h-10 rounded-lg px-4 text-sm font-medium text-white outline-none focus-visible:ring-2"
            >
              Try again
            </button>
            <a
              href="/dashboard"
              className="border-border-subtle text-text-secondary hover:text-text-primary flex h-10 items-center rounded-lg border px-4 text-sm font-medium no-underline"
            >
              Back to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
