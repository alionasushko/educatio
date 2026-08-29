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

test("the summary renders sections as headings, not bullets", async ({
  page,
  context,
}) => {
  const lesson = await createDemoLesson("E2E headings");
  await signIn(context, lesson.sessionJwt);
  await page.goto(`/lesson/${lesson.lessonId}`);
  await page.getByRole("button", { name: "End lesson" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End lesson" })
    .click();
  await expect(page).toHaveURL(/\/summary/, { timeout: 90_000 });
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible({
    timeout: 90_000,
  });

  const body = page.locator(".prose-summary");
  const heading = body.locator("h2, h3").first();
  await expect(heading).toBeVisible();

  // A heading that renders at body weight reads as an unstyled paragraph.
  const style = await heading.evaluate((node) => {
    const computed = getComputedStyle(node);
    const para = node.parentElement?.querySelector("p, li");
    return {
      weight: Number(computed.fontWeight),
      size: parseFloat(computed.fontSize),
      bodySize: para ? parseFloat(getComputedStyle(para).fontSize) : 0,
    };
  });
  expect(style.weight).toBeGreaterThanOrEqual(600);
  expect(style.size).toBeGreaterThan(style.bodySize);

  // The section names must not come through as list items, which is what the
  // prompt's own bulleted wording used to produce.
  const bulletText = await body.locator("li").allInnerTexts();
  for (const name of [
    "Topics covered",
    "Key concepts",
    "Suggested next steps",
  ]) {
    expect(bulletText.some((item) => item.trim().startsWith(name))).toBe(false);
  }

  await deleteLesson(lesson);
});

test("a waiting student sees the summary appear without reloading", async ({
  page,
  context,
  browser,
}) => {
  const lesson = await createDemoLesson("E2E waiting student");
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

  // The student lands on the summary before the tutor's generation finishes.
  await expect(student).toHaveURL(/\/summary/, { timeout: 30_000 });
  await expect(
    student.getByText(/tutor is writing the summary/i),
  ).toBeVisible();

  // No reload here on purpose — the summary must arrive on its own.
  await expect(student.locator(".prose-summary")).toBeVisible({
    timeout: 120_000,
  });

  await studentContext.close();
  await deleteLesson(lesson);
});

test("ending with unsaved edits does not fault the student's screen", async ({
  page,
  context,
  browser,
}) => {
  const lesson = await createDemoLesson("E2E unsaved edits");
  const res = await fetch(`${API}/lessons/${lesson.lessonId}`, {
    headers: { Authorization: `Bearer ${lesson.sessionJwt}` },
  });
  const { inviteCode } = (await res.json()) as { inviteCode: string };

  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  const errors: string[] = [];
  student.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 200));
  });

  await student.goto(`/join/${inviteCode}`);
  await student.getByLabel("Your name").fill("Jordan");
  await student.getByLabel("Your email").fill("jordan@example.com");
  await student.getByRole("button", { name: "Join lesson" }).click();
  await expect(student.getByRole("button", { name: "Pen (P)" })).toBeEnabled();

  await signIn(context, lesson.sessionJwt);
  await page.goto(`/lesson/${lesson.lessonId}`);
  await expect(page.getByRole("button", { name: "Pen (P)" })).toBeEnabled();

  // Draw and end immediately: the snapshot loop has not run, so the canvas
  // still has unsaved edits when the lesson closes.
  await student.getByRole("button", { name: "Pen (P)" }).click();
  const box = (await student.locator("canvas").first().boundingBox())!;
  await student.mouse.move(box.x + 120, box.y + 120);
  await student.mouse.down();
  await student.mouse.move(box.x + 260, box.y + 220, { steps: 10 });
  await student.mouse.up();
  await student.waitForTimeout(600);
  errors.length = 0;

  await page.getByRole("button", { name: "End lesson" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End lesson" })
    .click();

  await expect(student).toHaveURL(/\/summary/, { timeout: 30_000 });
  await student.waitForTimeout(6000);

  expect(errors.join(" | ")).not.toMatch(/unexpected response/i);
  expect(errors).toHaveLength(0);

  await studentContext.close();
  await deleteLesson(lesson);
});

test("the summary shows the whiteboard as it was left", async ({
  page,
  context,
}) => {
  const lesson = await createDemoLesson("E2E thumbnail");
  await signIn(context, lesson.sessionJwt);
  await page.goto(`/lesson/${lesson.lessonId}`);
  await expect(page.getByRole("button", { name: "Pen (P)" })).toBeEnabled();

  await page.getByRole("button", { name: "Pen (P)" }).click();
  const box = (await page.locator("canvas").first().boundingBox())!;
  await page.mouse.move(box.x + 140, box.y + 140);
  await page.mouse.down();
  await page.mouse.move(box.x + 300, box.y + 240, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "End lesson" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "End lesson" })
    .click();
  await expect(page).toHaveURL(/\/summary/, { timeout: 90_000 });

  const board = page.getByRole("img", {
    name: /whiteboard as it was left/i,
  });
  await expect(board).toBeVisible({ timeout: 30_000 });

  // The stroke itself must be drawn, not just an empty frame.
  await expect(board.locator("polyline")).toHaveCount(1);
  const points = await board.locator("polyline").getAttribute("points");
  expect((points ?? "").split(" ").length).toBeGreaterThan(3);

  await deleteLesson(lesson);
});

test("long note and text content wraps inside the thumbnail", async ({
  page,
  context,
}) => {
  const lesson = await createDemoLesson("E2E wrapping");
  const auth = { Authorization: `Bearer ${lesson.sessionJwt}` };
  const headers = { ...auth, "Content-Type": "application/json" };

  // Seeded through the api so the content is exact: the UI path cannot type a
  // paragraph into a sticky reliably.
  const long =
    "Backed by science, powered by people. Developed by our world-class team of in-house cosmetic chemists, every product is tested.";
  await fetch(`${API}/lessons/${lesson.lessonId}/snapshot`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      canvasState: {
        s1: {
          id: "s1",
          type: "sticky",
          x: 0,
          y: 0,
          width: 180,
          height: 180,
          rotation: 0,
          zIndex: 0,
          createdBy: "t",
          createdAt: 0,
          content: "hello, this is the first lesson",
          color: "blue",
        },
        t1: {
          id: "t1",
          type: "text",
          x: 260,
          y: 0,
          width: 320,
          height: 160,
          rotation: 0,
          zIndex: 1,
          createdBy: "t",
          createdAt: 0,
          content: long,
          fontSize: 16,
          fontWeight: "normal",
          fontStyle: "normal",
          color: "--text-primary",
        },
      },
    }),
  });
  await fetch(`${API}/lessons/${lesson.lessonId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "ended" }),
  });

  await signIn(context, lesson.sessionJwt);
  await page.goto(`/lesson/${lesson.lessonId}/summary`);
  const board = page.getByRole("img", { name: /whiteboard as it was left/i });
  await expect(board).toBeVisible({ timeout: 30_000 });

  // Both blocks must be broken into lines rather than run off their box.
  const texts = board.locator("text");
  await expect(texts).toHaveCount(2);
  for (const index of [0, 1]) {
    expect(await texts.nth(index).locator("tspan").count()).toBeGreaterThan(1);
  }

  // And every line must start back at its own left edge.
  const xs = await board
    .locator("text")
    .nth(1)
    .locator("tspan")
    .evaluateAll((spans) => spans.map((span) => span.getAttribute("x")));
  expect(new Set(xs).size).toBe(1);

  await deleteLesson(lesson);
});
