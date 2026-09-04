"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const RESET_AFTER_MS = 2000;

interface Clipboard {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

export const useCopyToClipboard = (): Clipboard => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setCopied(false);
  }, [clearTimer]);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        clearTimer();
        setCopied(true);
        timer.current = setTimeout(() => setCopied(false), RESET_AFTER_MS);
        return true;
      } catch {
        reset();
        return false;
      }
    },
    [clearTimer, reset],
  );

  return { copied, copy, reset };
};
