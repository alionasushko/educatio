"use client";

import { useCallback, useSyncExternalStore } from "react";

export const useMediaQuery = (
  query: string,
  serverSnapshot: boolean,
): boolean => {
  const subscribe = useCallback(
    (callback: () => void): (() => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
};
