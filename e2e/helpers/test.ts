import { test as base } from "@playwright/test";

export const test = base.extend<{ devOverlayOutOfTheWay: void }>({
  devOverlayOutOfTheWay: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        const hide = () => {
          const style = document.createElement("style");
          style.textContent = "nextjs-portal { display: none !important; }";
          (document.head ?? document.documentElement).appendChild(style);
        };
        if (document.head) hide();
        else
          document.addEventListener("DOMContentLoaded", hide, { once: true });
      });
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
export type { Page, Locator, BrowserContext } from "@playwright/test";
