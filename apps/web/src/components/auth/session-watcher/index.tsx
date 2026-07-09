"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { checkSessionAction } from "@/app/verify/actions";
import { MAX_POLL_MS, POLL_INTERVAL_MS } from "./helpers/constants";

const SessionWatcher = () => {
  const router = useRouter();
  const checking = useRef(false);

  useEffect(() => {
    const startedAt = Date.now();

    const check = async () => {
      if (checking.current || document.visibilityState !== "visible") return;
      checking.current = true;
      try {
        if (await checkSessionAction()) router.replace("/dashboard");
      } catch (error) {
        console.error("session check failed", error);
      } finally {
        checking.current = false;
      }
    };

    const interval = setInterval(() => {
      if (Date.now() - startedAt > MAX_POLL_MS) {
        clearInterval(interval);
        return;
      }
      void check();
    }, POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", check);
    void check();

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

  return null;
};

export default SessionWatcher;
