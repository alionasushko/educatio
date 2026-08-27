import { test, expect } from "@playwright/test";
import { createDemoLesson, deleteLesson, signIn } from "./helpers/session";

const API = process.env.E2E_API_URL ?? "http://localhost:3001";

const inviteCodeOf = async (lesson: {
  sessionJwt: string;
  lessonId: string;
}): Promise<string> => {
  const res = await fetch(`${API}/lessons/${lesson.lessonId}`, {
    headers: { Authorization: `Bearer ${lesson.sessionJwt}` },
  });
  const body = (await res.json()) as { inviteCode: string };
  return body.inviteCode;
};

test("a student joins from an invite link and shares the room", async ({
  page,
  context,
  browser,
}) => {
  const lesson = await createDemoLesson("E2E join");
  const inviteCode = await inviteCodeOf(lesson);

  await signIn(context, lesson.sessionJwt);
  await page.goto(`/lesson/${lesson.lessonId}`);
  await expect(page.getByRole("button", { name: "Pen (P)" })).toBeEnabled();

  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  await student.goto(`/join/${inviteCode}`);
  await student.getByLabel("Your name").fill("Jordan");
  await student.getByRole("button", { name: "Join lesson" }).click();

  await expect(student).toHaveURL(
    new RegExp(`/lesson/${lesson.lessonId}\\?role=student`),
  );
  await expect(student.locator("canvas").first()).toBeVisible();

  await expect(
    page.getByRole("group", { name: /other in the lesson/ }),
  ).toBeVisible();
  await expect(student.getByRole("button", { name: "Share" })).toHaveCount(0);

  await expect(student.getByRole("link", { name: "Back" })).toHaveCount(0);
  await expect(student.getByRole("link", { name: /Educatio/ })).toHaveCount(0);

  const [cookie] = (await studentContext.cookies()).filter(
    (c) => c.name === "educatio_session",
  );
  const days = (cookie!.expires - Date.now() / 1000) / 86_400;
  expect(days).toBeGreaterThan(6);
  expect(days).toBeLessThan(8);

  await studentContext.close();
  await deleteLesson(lesson);
});

test("an invalid invite code is refused", async ({ page }) => {
  await page.goto("/join/not-a-real-code");
  await page.getByLabel("Your name").fill("Jordan");
  await page.getByRole("button", { name: "Join lesson" }).click();

  await expect(page.locator("form [role=alert]")).toContainText(/invite code/i);
  await expect(page).toHaveURL(/\/join\//);
});

test("a signed-in tutor is warned before their session is replaced", async ({
  page,
  context,
}) => {
  const lesson = await createDemoLesson("E2E join guard");
  const inviteCode = await inviteCodeOf(lesson);
  await signIn(context, lesson.sessionJwt);

  await page.goto(`/join/${inviteCode}`);
  await expect(page.getByText(/already signed in/i)).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /back to my dashboard/i }),
  ).toBeVisible();

  await page.getByRole("button", { name: /join as a student/i }).click();
  await expect(page.getByLabel("Your name")).toBeVisible();

  await deleteLesson(lesson);
});
