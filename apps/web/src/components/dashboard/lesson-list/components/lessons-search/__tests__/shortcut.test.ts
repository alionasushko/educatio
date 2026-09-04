import { describe, expect, it } from "vitest";
import { shortcutLabel } from "../helpers/shortcut";

describe("which key the search box advertises", () => {
  it("offers command on Apple hardware", () => {
    for (const ua of [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
    ]) {
      expect(shortcutLabel(ua)).toBe("⌘K");
    }
  });

  it("falls back to control when no user-agent is sent", () => {
    expect(shortcutLabel(null)).toBe("Ctrl K");
  });

  it("offers control everywhere else", () => {
    for (const ua of [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Mozilla/5.0 (X11; Linux x86_64)",
      "Mozilla/5.0 (Linux; Android 14)",
    ]) {
      expect(shortcutLabel(ua)).toBe("Ctrl K");
    }
  });
});
