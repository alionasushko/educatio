import "server-only";

export function requireApiUrl(): string {
  const url = process.env.EDUCATIO_API_URL;
  if (!url) {
    throw new Error(
      "EDUCATIO_API_URL is not set — configure the api base URL for this environment.",
    );
  }
  return url;
}
