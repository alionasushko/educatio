import { test, expect } from "./helpers/test";
import { createDemoLesson, deleteLesson } from "./helpers/session";

const API = process.env.E2E_API_URL ?? "http://localhost:3001";

test.beforeEach(() => test.setTimeout(120_000));

test("a student's session survives WebKit and reaches the room", async ({
  page,
  context,
}) => {
  const lesson = await createDemoLesson("E2E webkit session");
  const res = await fetch(`${API}/lessons/${lesson.lessonId}`, {
    headers: { Authorization: `Bearer ${lesson.sessionJwt}` },
  });
  const { inviteCode } = (await res.json()) as { inviteCode: string };

  const rejected: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("liveblocks-auth") && r.status() >= 400) {
      rejected.push(`${r.status()} ${r.url()}`);
    }
  });

  await page.goto(`/join/${inviteCode}`);
  await page.getByLabel("Your name").fill("Jordan");
  await page.getByLabel("Your email").fill("jordan@example.com");
  await page.getByRole("button", { name: "Join lesson" }).click();

  await expect(page).toHaveURL(new RegExp(`/lesson/${lesson.lessonId}`));

  // WebKit refuses a Secure cookie over http, which silently broke every
  // authenticated request in local development while Chromium was fine.
  const cookies = await context.cookies();
  expect(cookies.map((cookie) => cookie.name)).toContain("educatio_session");

  await expect(page.locator("canvas").first()).toBeVisible();
  await page.waitForTimeout(3000);
  expect(rejected).toEqual([]);

  await deleteLesson(lesson);
});
