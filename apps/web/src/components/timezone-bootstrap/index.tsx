"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TIMEZONE_COOKIE } from "@/lib/timezone";

interface Props {
  current?: string;
}

const TimezoneBootstrap = ({ current }: Props) => {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || tz === current) return;

    document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(tz)};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  }, [current, router]);

  return null;
};

export default TimezoneBootstrap;
