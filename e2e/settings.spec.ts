import { test, expect } from "./helpers/test";
import { signIn } from "./helpers/session";
import {
  createLessonFor,
  createThrowawayTutor,
  removeTutor,
  tutorFootprint,
  type ThrowawayTutor,
} from "./helpers/tutor";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001";

const demoSession = async (): Promise<{
  sessionJwt: string;
  email: string;
}> => {
  const { sessionJwt } = (await (
    await fetch(`${API_URL}/auth/demo`, { method: "POST" })
  ).json()) as { sessionJwt: string };
  const { user } = (await (
    await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${sessionJwt}` },
    })
  ).json()) as { user: { email: string } };
  return { sessionJwt, email: user.email };
};

const me = (sessionJwt: string) =>
  fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${sessionJwt}` },
  });

test("a tutor renames themselves from settings", async ({ page, context }) => {
  const tutor = await createThrowawayTutor();
  try {
    await signIn(context, tutor.sessionJwt);
    await page.goto("/settings");

    const name = page.getByLabel("Name");
    await expect(name).toHaveValue("E2E Tutor");
    await name.fill("Renamed Tutor");
    await page.getByRole("button", { name: "Save name" }).click();

    await expect
      .poll(async () => {
        const body = (await (await me(tutor.sessionJwt)).json()) as {
          user?: { name?: string };
        };
        return body.user?.name;
      })
      .toBe("Renamed Tutor");
  } finally {
    await removeTutor(tutor);
  }
});

test("deleting the account takes the lessons with it", async ({
  page,
  context,
}) => {
  const tutor = await createThrowawayTutor();
  let survived: ThrowawayTutor | null = tutor;
  try {
    await createLessonFor(tutor, "Doomed lesson");
    expect(await tutorFootprint(tutor)).toMatchObject({ users: 1, lessons: 1 });

    await signIn(context, tutor.sessionJwt);
    await page.goto("/settings");
    await page.getByRole("button", { name: "Delete account" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete account" }).click();

    await page.waitForURL("**/");

    expect(await tutorFootprint(tutor)).toEqual({
      users: 0,
      lessons: 0,
      magicLinks: 0,
    });
    expect((await me(tutor.sessionJwt)).status).toBe(401);
    survived = null;
  } finally {
    if (survived) await removeTutor(survived);
  }
});

test("a demo visitor gets their own account, not a shared one", async ({
  page,
  context,
}) => {
  const first = await demoSession();
  const second = await demoSession();
  expect(first.email).not.toBe(second.email);

  await signIn(context, first.sessionJwt);
  await page.goto("/settings");

  await expect(page.getByText("deleted after 24 hours")).toBeVisible();
  // Their own account, so nothing here is locked.
  await expect(page.getByLabel("Name")).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Delete account" }),
  ).toBeEnabled();
  await expect(page.getByRole("link", { name: /password/i })).toBeVisible();
});

test("a demo account arrives with lessons to look at", async ({
  page,
  context,
}) => {
  const demo = await demoSession();
  await signIn(context, demo.sessionJwt);
  await page.goto("/dashboard");

  await expect(
    page.getByText("Quadratic equations").filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Trigonometry").filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByText("Ended").first()).toBeVisible();
  await expect(
    page.getByRole("main").getByText("Active").first(),
  ).toBeVisible();

  // An ended lesson opens on a real summary, not an empty page waiting on Gemini.
  await page.getByText("Quadratic equations").filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/summary/);
  await expect(
    page.getByRole("heading", { name: "Topics covered" }),
  ).toBeVisible();
  await expect(page.getByText("The whiteboard at the end")).toBeVisible();
});

test("a seeded active lesson opens with its canvas already drawn", async ({
  page,
  context,
}) => {
  const demo = await demoSession();
  await signIn(context, demo.sessionJwt);
  await page.goto("/dashboard");

  await page.getByText("Trigonometry").filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/lesson\//);
  await expect(page.getByRole("button", { name: "Pen (P)" })).toBeEnabled({
    timeout: 15_000,
  });

  // Storage was seeded server-side, so the board is not blank on arrival.
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const stage = (
            window as unknown as {
              Konva?: { stages: { find: (s: string) => unknown[] }[] };
            }
          ).Konva?.stages[0];
          return stage?.find("Text").length ?? 0;
        }),
      { message: "the seeded canvas never rendered", timeout: 15_000 },
    )
    .toBeGreaterThan(0);
});

test("a long demo address wraps inside its card", async ({ page, context }) => {
  const demo = await demoSession();
  await signIn(context, demo.sessionJwt);
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto("/settings");

  const overflow = await page
    .getByRole("main")
    .getByText(demo.email)
    .evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return (
        range.getBoundingClientRect().right - el.getBoundingClientRect().right
      );
    });

  expect(overflow).toBeLessThanOrEqual(0);
});
