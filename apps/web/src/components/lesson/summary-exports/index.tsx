"use client";

import { useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  Loader2Icon,
  DownloadIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseSummaryBlocks, toPlainText } from "@/lib/summary-markdown";

interface Props {
  lessonTitle: string;
  meta: string;
  summary: string;
}

const slug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "lesson";

const save = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const control = cn(
  buttonVariants({ variant: "outline" }),
  "h-9 gap-1.5 px-3 text-sm",
);

const SummaryExports = ({ lessonTitle, meta, summary }: Props) => {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>();

  const downloadPdf = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const [{ pdf }, { default: SummaryDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./helpers/summary-document"),
      ]);
      const blob = await pdf(
        <SummaryDocument
          lessonTitle={lessonTitle}
          meta={meta}
          generatedOn={new Date().toLocaleDateString("en-GB", {
            dateStyle: "long",
          })}
          blocks={parseSummaryBlocks(summary)}
        />,
      ).toBlob();
      save(blob, `${slug(lessonTitle)}-summary.pdf`);
    } catch (err) {
      console.error(err);
      setError("We couldn't build the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const downloadText = () => {
    save(
      new Blob([toPlainText(summary)], { type: "text/plain;charset=utf-8" }),
      `${slug(lessonTitle)}-summary.txt`,
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(summary));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Your browser blocked the clipboard.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={downloadPdf}
        disabled={busy}
        className={control}
      >
        {busy ? (
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <DownloadIcon className="size-4" aria-hidden="true" />
        )}
        {busy ? "Building…" : "Download PDF"}
      </button>

      <button type="button" onClick={downloadText} className={control}>
        <FileTextIcon className="size-4" aria-hidden="true" />
        Download text
      </button>

      <button type="button" onClick={copy} className={control}>
        {copied ? (
          <CheckIcon className="size-4" aria-hidden="true" />
        ) : (
          <CopyIcon className="size-4" aria-hidden="true" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>

      {error && (
        <p role="alert" className="text-destructive text-[13px]">
          {error}
        </p>
      )}
    </div>
  );
};

export default SummaryExports;
