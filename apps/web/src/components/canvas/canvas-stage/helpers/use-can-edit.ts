"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 768px)";

const subscribe = (callback: () => void): (() => void) => {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
};

export const useCanEdit = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
