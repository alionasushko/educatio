export const APPLE_LABEL = "⌘K";
export const OTHER_LABEL = "Ctrl K";

export const shortcutLabel = (userAgent: string | null): string =>
  /mac|iphone|ipad|ipod/i.test(userAgent ?? "") ? APPLE_LABEL : OTHER_LABEL;
