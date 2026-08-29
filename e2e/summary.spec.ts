import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";

// react-pdf flate-compresses its content streams and draws text as hex runs
// inside TJ arrays, so the words are only readable after inflating and decoding.
// Without this a blank PDF passes every check.
const pdfText = (pdf: Buffer): string => {
  const raw = pdf.toString("latin1");
  const marker = /stream\r?\n/g;
  let text = "";
  let match: RegExpExecArray | null;
  while ((match = marker.exec(raw)) !== null) {
    const start = match.index + match[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) continue;
    try {
      text += inflateSync(
        Buffer.from(raw.slice(start, end), "latin1"),
      ).toString("latin1");
    } catch {
      // not a deflate stream (fonts, metadata) — skip it
    }
  }
  return (text.match(/<([0-9a-fA-F]{2,})>/g) ?? [])
    .map((run) => Buffer.from(run.slice(1, -1), "hex").toString("latin1"))
    .join("");
};
import { createDemoLesson, deleteLesson, signIn } from "./helpers/session";

const API = process.env.E2E_API_URL ?? "http://localhost:3001";

// Ending a lesson waits on real summary generation, which routinely runs past
// Playwright's 30s default.
test.beforeEach(() => test.setTimeout(150_000));

test("ending a lesson closes the canvas and lands on the summary", async ({
  page,
  context,
}) => {
  const lesson = await createDemoLesson("E2E end lesson");
  await signIn(context, lesson.sessionJwt);
  await page.goto(`/lesson/${lesson.lessonId}`);
  await expect(page.getByRole("button", { name: "Pen (P)" })).toBeEnabled();

  await page.getByRole("button", { name: "End lesson" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "End lesson" }).click();

  await expect(page).toHaveURL(
    new RegExp(`/lesson/${lesson.lessonId}/summary`),
    { timeout: 90_000 },
  );
  await expect(
    page.getByRole("heading", { name: "E2E end lesson" }),
  ).toBeVisible();

  // The canvas must not reopen for editing once the lesson has ended: the
  // lesson route sends an ended lesson to its summary instead.
  await page.goto(`/lesson/${lesson.lessonId}`);
  await expect(page).toHaveURL(/\/summary/);
  await expect(page.getByRole("button", { name: "Pen (P)" })).toHaveCount(0);

  await deleteLesson(lesson);
});

test("a live lesson has no summary page to visit", async ({
  page,
  context,
}) => {
  const lesson = await createDemoLesson("E2E live lesson");
  await signIn(context, lesson.sessionJwt);

  await page.goto(`/lesson/${lesson.lessonId}/summary`);
  await expect(page).toHaveURL(new RegExp(`/lesson/${lesson.lessonId}$`));

  await deleteLesson(lesson);
});

test("the dashboard row for an ended lesson resolves", async ({
  page,
  context,
}) => {
  const lesson = await createDemoLesson("E2E ended row");
  await signIn(context, lesson.sessionJwt);
  await page.goto(`/lesson/${lesson.lessonId}`);
  await page.getByRole("button", { name: "End lesson" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End lesson" })
    .click();
  await expect(page).toHaveURL(/\/summary/, { timeout: 90_000 });

  await page.goto("/dashboard");
  await page
    .getByRole("link", { name: /E2E ended row/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/summary/, { timeout: 90_000 });
  // A 404 also sits at /summary, so assert on what only the real page renders.
  await expect(
    page.getByRole("heading", { name: "E2E ended row" }),
  ).toBeVisible();

  await deleteLesson(lesson);
});

test("the student's email carries through to a prefilled mail draft", async ({
  page,
  context,
  browser,
}) => {
  const lesson = await createDemoLesson("E2E email summary");
  const res = await fetch(`${API}/lessons/${lesson.lessonId}`, {
    headers: { Authorization: `Bearer ${lesson.sessionJwt}` },
  });
  const { inviteCode } = (await res.json()) as { inviteCode: string };

  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  await student.goto(`/join/${inviteCode}`);
  await student.getByLabel("Your name").fill("Jordan");
  await student.getByLabel("Your email").fill("jordan@example.com");
  await student.getByRole("button", { name: "Join lesson" }).click();
  await expect(student.locator("canvas").first()).toBeVisible();
  await studentContext.close();

  await signIn(context, lesson.sessionJwt);
  await page.goto(`/lesson/${lesson.lessonId}`);
  await page.getByRole("button", { name: "End lesson" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End lesson" })
    .click();
  await expect(page).toHaveURL(/\/summary/, { timeout: 90_000 });

  // The button only appears once the summary exists, and generation now runs
  // on this page rather than inside the end action.
  const mail = page.getByRole("link", { name: /email to student/i });
  await expect(mail).toBeVisible({ timeout: 90_000 });
  const href = await mail.getAttribute("href");
  expect(href).toContain("mailto:jordan%40example.com");
  expect(href).toContain("subject=");
  const body = decodeURIComponent(href!.split("body=")[1] ?? "");
  expect(body.length).toBeGreaterThan(50);

  // mailto bodies are plain text, so markdown syntax must be stripped, not sent.
  expect(body).not.toMatch(/\*\*|\$\$|```/);
  expect(body).not.toMatch(/^#{1,6}\s/m);

  // The whole summary must be there — not a truncated prefix. Checked from the
  // page's end into the body; the reverse direction also passes for any prefix.
  const rendered = (await page.locator("main").innerText())
    .replace(/\s+/g, " ")
    .trim();
  expect(body.replace(/\s+/g, " ")).toContain(rendered.slice(-40));

  await deleteLesson(lesson);
});

test("a student sees the lesson end without reloading", async ({
  page,
  context,
  browser,
}) => {
  const lesson = await createDemoLesson("E2E live end");
  const res = await fetch(`${API}/lessons/${lesson.lessonId}`, {
    headers: { Authorization: `Bearer ${lesson.sessionJwt}` },
  });
  const { inviteCode } = (await res.json()) as { inviteCode: string };

  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  await student.goto(`/join/${inviteCode}`);
  await student.getByLabel("Your name").fill("Jordan");
  await student.getByLabel("Your email").fill("jordan@example.com");
  await student.getByRole("button", { name: "Join lesson" }).click();
  await expect(student.locator("canvas").first()).toBeVisible();

  await signIn(context, lesson.sessionJwt);
  await page.goto(`/lesson/${lesson.lessonId}`);
  await expect(page.getByRole("button", { name: "Pen (P)" })).toBeEnabled();

  await page.getByRole("button", { name: "End lesson" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End lesson" })
    .click();

  // No reload here on purpose — that is the bug being guarded. The student
  // should land on the same summary screen the tutor sees.
  await expect(student).toHaveURL(/\/summary/, { timeout: 30_000 });
  await expect(
    student.getByRole("heading", { name: "E2E live end" }),
  ).toBeVisible();
  await expect(student.locator("canvas")).toHaveCount(0);

  // The meta line names the other person, so a student must not read their own
  // name back as "with Jordan".
  const meta = student.locator("main p").first();
  await expect(meta).toContainText(/with Demo Tutor/i);
  await expect(meta).not.toContainText(/with Jordan/i);
  // Students get the summary, but never the controls for producing or sending it.
  await expect(
    student.getByRole("button", { name: /generate summary/i }),
  ).toHaveCount(0);
  await expect(student.getByRole("link", { name: /email/i })).toHaveCount(0);

  await studentContext.close();
  await deleteLesson(lesson);
});

test("the summary exports as a real PDF and as plain text", async ({
  page,
  context,
}) => {
  const lesson = await createDemoLesson("E2E exports");
  await signIn(context, lesson.sessionJwt);
  await page.goto(`/lesson/${lesson.lessonId}`);
  await page.getByRole("button", { name: "End lesson" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End lesson" })
    .click();
  await expect(page).toHaveURL(/\/summary/, { timeout: 90_000 });

  const exportBar = page.getByRole("button", { name: "Download PDF" });
  await expect(exportBar).toBeVisible({ timeout: 90_000 });

  const [pdfDownload] = await Promise.all([
    page.waitForEvent("download"),
    exportBar.click(),
  ]);
  expect(pdfDownload.suggestedFilename()).toMatch(/e2e-exports-summary\.pdf$/);
  const pdfPath = await pdfDownload.path();
  const pdf = await readFile(pdfPath);
  // A real PDF, not an empty or error blob.
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  // The summary itself must be drawn into the page, not just a valid shell.
  const drawn = pdfText(pdf);
  expect(drawn).toContain("Lesson Summary");
  expect(drawn).toContain("E2E exports");
  const words = (await page.locator("main").innerText())
    .split(/\s+/)
    .filter((word) => word.length > 6);
  expect(drawn).toContain(words[words.length - 1]!);

  const [txtDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download text" }).click(),
  ]);
  const txt = await readFile(await txtDownload.path(), "utf8");
  expect(txt.length).toBeGreaterThan(50);
  expect(txt).not.toMatch(/\*\*|^#{1,6}\s/m);

  await deleteLesson(lesson);
});
