"use client";

import { useMediaQuery } from "@/lib/use-media-query";

const QUERY = "(prefers-reduced-motion: reduce)";

export const usePrefersReducedMotion = (): boolean =>
  useMediaQuery(QUERY, false);
