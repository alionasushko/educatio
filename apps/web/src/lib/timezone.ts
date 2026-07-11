export const TIMEZONE_COOKIE = "educatio_tz";

export const safeTimeZone = (raw?: string): string | undefined => {
  if (!raw || raw.length > 64) return undefined;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: raw });
    return raw;
  } catch {
    return undefined;
  }
};
