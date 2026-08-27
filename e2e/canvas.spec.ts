import { test, expect, type Page } from "@playwright/test";
import {
  createDemoLesson,
  deleteLesson,
  signIn,
  type DemoLesson,
} from "./helpers/session";

const API = process.env.E2E_API_URL ?? "http://localhost:3001";

let lesson: DemoLesson;

test.beforeEach(async () => {
  lesson = await createDemoLesson("E2E canvas");
});

test.afterEach(async () => {
  await deleteLesson(lesson);
});

const openCanvas = async (page: Page) => {
  await page.goto(`/lesson/${lesson.lessonId}`);
  await expect(
    page.getByRole("toolbar", { name: "Canvas tools" }),
  ).toBeVisible();
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  // Tools stay disabled until room storage has loaded; drawing before that
  // would throw inside the mutation and silently lose the stroke.
  await expect(page.getByRole("button", { name: "Pen (P)" })).toBeEnabled();
  return canvas;
};

test("the toolbar drives tool selection", async ({ page, context }) => {
  await signIn(context, lesson.sessionJwt);
  await openCanvas(page);

  const select = page.getByRole("button", { name: "Select (V)" });
  const pen = page.getByRole("button", { name: "Pen (P)" });

  await expect(select).toHaveAttribute("aria-pressed", "true");
  await expect(pen).toHaveAttribute("aria-pressed", "false");

  await pen.click();
  await expect(pen).toHaveAttribute("aria-pressed", "true");
  await expect(select).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("v");
  await expect(select).toHaveAttribute("aria-pressed", "true");
});

test("the pickers follow the tool that needs them", async ({
  page,
  context,
}) => {
  await signIn(context, lesson.sessionJwt);
  await openCanvas(page);

  // `exact` matters: getByRole matches the accessible name as a substring by
  // default, so "Color" would also match the "Sticky color" group.
  const ink = page.getByRole("group", { name: "Color", exact: true });
  const sticky = page.getByRole("group", { name: "Sticky color", exact: true });
  const stroke = page.getByRole("group", { name: "Stroke width" });

  // Select has nothing to color.
  await expect(ink).toBeHidden();
  await expect(sticky).toBeHidden();
  await expect(stroke).toBeHidden();

  await page.getByRole("button", { name: "Pen (P)" }).click();
  await expect(ink).toBeVisible();
  await expect(stroke).toBeVisible();
  await expect(sticky).toBeHidden();

  // A sticky's color is a closed set, so it gets its own palette.
  await page.getByRole("button", { name: "Sticky note (S)" }).click();
  await expect(sticky).toBeVisible();
  await expect(ink).toBeHidden();
  await expect(stroke).toBeHidden();

  const green = sticky.getByRole("button", { name: "Green" });
  await expect(green).toHaveAttribute("aria-pressed", "false");
  await green.click();
  await expect(green).toHaveAttribute("aria-pressed", "true");

  // Choosing a tool must not silently reset a color chosen for another one.
  await page.getByRole("button", { name: "Pen (P)" }).click();
  await ink.getByRole("button", { name: "Rust" }).click();
  await page.getByRole("button", { name: "Sticky note (S)" }).click();
  await expect(sticky.getByRole("button", { name: "Green" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("drawing writes to storage and one undo reverses the whole stroke", async ({
  page,
  context,
}) => {
  await signIn(context, lesson.sessionJwt);
  const canvas = await openCanvas(page);

  const undo = page.getByRole("button", { name: "Undo (Cmd+Z)" });
  await expect(undo).toBeDisabled();

  await page.getByRole("button", { name: "Pen (P)" }).click();

  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas has no box");
  await page.mouse.move(box.x + 150, box.y + 150);
  await page.mouse.down();
  for (let step = 1; step <= 12; step += 1) {
    await page.mouse.move(box.x + 150 + step * 12, box.y + 150 + step * 6);
  }
  await page.mouse.up();

  await expect(undo).toBeEnabled();

  // A drag is many storage writes; history.pause() should make it one step.
  await undo.click();
  await expect(undo).toBeDisabled();
});

test("the image tool refuses a file that is not an image", async ({
  page,
  context,
}) => {
  await signIn(context, lesson.sessionJwt);
  const canvas = await openCanvas(page);

  await page.getByRole("button", { name: "Image (I)" }).click();

  const chooser = page.waitForEvent("filechooser");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas has no box");
  await page.mouse.click(box.x + 220, box.y + 180);

  // Rejected before any upload, so this holds whether or not blob storage is
  // configured.
  await (
    await chooser
  ).setFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });

  await expect(page.getByText("That file type isn't supported.")).toBeVisible();
});

test("leaving the lesson persists the canvas", async ({ page, context }) => {
  await signIn(context, lesson.sessionJwt);

  await page.goto(`/lesson/${lesson.lessonId}`);
  await expect(page.getByRole("button", { name: "Pen (P)" })).toBeEnabled();

  await page.getByRole("button", { name: "Sticky note (S)" }).click();
  const box = await page.locator("canvas").first().boundingBox();
  if (!box) throw new Error("no box");
  await page.mouse.click(box.x + 250, box.y + 200);

  const read = async () => {
    const res = await fetch(`${API}/lessons/${lesson.lessonId}/snapshot`, {
      headers: { Authorization: `Bearer ${lesson.sessionJwt}` },
    });
    return (await res.json()) as { snapshot: { canvasState: object } | null };
  };
  expect((await read()).snapshot).toBeNull();

  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await expect
    .poll(
      async () =>
        Object.keys((await read()).snapshot?.canvasState ?? {}).length,
      { message: "leaving did not flush the canvas", timeout: 15_000 },
    )
    .toBeGreaterThan(0);
});

test("leaving before storage loads raises nothing", async ({
  page,
  context,
}) => {
  await signIn(context, lesson.sessionJwt);

  // Deterministic: with no room token the client never loads storage, which is
  // the state the snapshot loop's unmount flush used to throw in.
  await page.route("**/liveblocks-auth", (route) => route.abort());
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __rejected: string[] }).__rejected = seen;
    window.addEventListener("unhandledrejection", (event) => {
      seen.push(String(event.reason?.message ?? event.reason));
    });
  });

  await page.goto(`/lesson/${lesson.lessonId}`);
  // A client-side navigation, so the page survives and unmounts the canvas.
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  expect(
    await page.evaluate(
      () => (window as unknown as { __rejected: string[] }).__rejected,
    ),
  ).toEqual([]);
});

test("each person sees the other's cursor and name", async ({ browser }) => {
  const tutor = await browser.newContext();
  const peer = await browser.newContext();
  await signIn(tutor, lesson.sessionJwt);
  await signIn(peer, lesson.sessionJwt);

  const tutorPage = await tutor.newPage();
  const peerPage = await peer.newPage();
  await tutorPage.goto(`/lesson/${lesson.lessonId}`);
  await peerPage.goto(`/lesson/${lesson.lessonId}`);
  await expect(
    tutorPage.getByRole("button", { name: "Pen (P)" }),
  ).toBeEnabled();
  await expect(peerPage.getByRole("button", { name: "Pen (P)" })).toBeEnabled();

  // Each side shows the other in the presence stack.
  await expect(
    peerPage.getByRole("group", { name: /other in the lesson/ }),
  ).toBeVisible();

  const box = await tutorPage.locator("canvas").first().boundingBox();
  if (!box) throw new Error("canvas has no box");
  await tutorPage.mouse.move(box.x + 200, box.y + 160);
  await tutorPage.mouse.move(box.x + 260, box.y + 200);

  // The name pill rides along with the cursor, so finding it proves both.
  await expect(
    peerPage.getByText("Demo Tutor", { exact: false }).first(),
  ).toBeVisible({ timeout: 15_000 });

  await tutor.close();
  await peer.close();
});

test("a peer sees what the other person draws", async ({ browser }) => {
  const tutor = await browser.newContext();
  const peer = await browser.newContext();
  await signIn(tutor, lesson.sessionJwt);
  await signIn(peer, lesson.sessionJwt);

  const tutorPage = await tutor.newPage();
  const peerPage = await peer.newPage();

  await tutorPage.goto(`/lesson/${lesson.lessonId}`);
  await peerPage.goto(`/lesson/${lesson.lessonId}`);
  const peerCanvas = peerPage.locator("canvas").first();
  await expect(peerCanvas).toBeVisible();
  await expect(
    tutorPage.getByRole("button", { name: "Sticky note (S)" }),
  ).toBeEnabled();

  const before = await peerCanvas.screenshot();

  await tutorPage.getByRole("button", { name: "Sticky note (S)" }).click();
  const tutorCanvas = tutorPage.locator("canvas").first();
  const box = await tutorCanvas.boundingBox();
  if (!box) throw new Error("canvas has no box");
  await tutorPage.mouse.click(box.x + 300, box.y + 220);

  await expect
    .poll(async () => (await peerCanvas.screenshot()).equals(before), {
      message: "peer canvas never changed after the other person drew",
      timeout: 15_000,
    })
    .toBe(false);

  await tutor.close();
  await peer.close();
});
