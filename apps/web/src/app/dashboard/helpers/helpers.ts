import type { LessonFilter } from "@/components/dashboard/lessons-view/helpers/constants";

const STATUS_VALUES: LessonFilter[] = ["all", "active", "ended"];

export const parseStatus = (raw?: string | string[]): LessonFilter => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return STATUS_VALUES.includes(value as LessonFilter)
    ? (value as LessonFilter)
    : "all";
};

export const parsePage = (raw?: string | string[]): number => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
};

export const parseQuery = (raw?: string | string[]): string => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
};
