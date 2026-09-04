"use client";

import { useMediaQuery } from "@/lib/use-media-query";

const QUERY = "(min-width: 768px)";

export const useCanEdit = (): boolean => useMediaQuery(QUERY, true);
