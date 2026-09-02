import { expect } from "@playwright/test";
import { test } from "./helpers/test";
import { createDemoLesson, deleteLesson, signIn } from "./helpers/session";
import type { DemoLesson } from "./helpers/session";

declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

const REQUIRED = [
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
];

let lesson: DemoLesson;

test.beforeAll(async () => {
  lesson = await createDemoLesson("Security headers");
});

test.afterAll(async () => {
  await deleteLesson(lesson);
});

test("every page carries the security headers", async ({ page }) => {
  const response = await page.goto("/");
  const headers = response!.headers();

  for (const name of REQUIRED) {
    expect(headers[name], `${name} is missing`).toBeTruthy();
  }

  const csp = headers["content-security-policy"];
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("base-uri 'self'");
  expect(csp).toContain("form-action 'self'");
  expect(csp).not.toContain("connect-src *");
});

test("the pages a tutor uses raise no policy violations", async ({
  page,
  context,
}) => {
  await signIn(context, lesson.sessionJwt);
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__cspViolations?.push(
        `${event.violatedDirective} blocked ${event.blockedURI}`,
      );
    });
  });

  for (const path of [
    "/",
    "/sign-in",
    "/dashboard",
    `/lesson/${lesson.lessonId}`,
    "/settings",
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const violations = await page.evaluate(() => window.__cspViolations ?? []);
    expect(violations, `on ${path}`).toEqual([]);
  }
});
