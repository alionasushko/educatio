"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, Share2Icon } from "lucide-react";
import Dialog from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  inviteCode: string;
}

const ShareLessonButton = ({ inviteCode }: Props) => {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const open = () => {
    setCopied(false);
    setLink(`${window.location.origin}/join/${inviteCode}`);
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 gap-1.5 px-3 text-sm",
        )}
      >
        <Share2Icon className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {link && (
        <Dialog
          onClose={() => setLink(null)}
          label="Invite your student"
          className="max-w-115"
        >
          <h2 className="text-text-primary text-[18px] font-semibold tracking-[-0.015em]">
            Invite your student
          </h2>
          <p className="text-text-secondary mt-2 text-[13.5px] leading-normal">
            Send this link. They add their name and join straight away — no
            account needed.
          </p>

          <div className="border-border-subtle bg-bg mt-5 flex items-center gap-2 rounded-[10px] border p-2 pl-3">
            <span className="text-text-secondary min-w-0 flex-1 truncate font-mono text-[13px]">
              {link}
            </span>
            <button
              type="button"
              onClick={copy}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-8 shrink-0 gap-1.5 px-2.5 text-[13px]",
              )}
            >
              {copied ? (
                <CheckIcon className="size-3.5" aria-hidden="true" />
              ) : (
                <CopyIcon className="size-3.5" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <p aria-live="polite" className="sr-only">
            {copied ? "Invite link copied to clipboard" : ""}
          </p>
        </Dialog>
      )}
    </>
  );
};

export default ShareLessonButton;
