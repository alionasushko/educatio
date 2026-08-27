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

test("resizing a sticky changes its stored size, in one undo step", async ({
  page,
  context,
}) => {
  await signIn(context, lesson.sessionJwt);
  const canvas = await openCanvas(page);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas has no box");

  await page.getByRole("button", { name: "Sticky note (S)" }).click();
  await page.mouse.click(box.x + 260, box.y + 220);
  await page.keyboard.press("Escape");

  const sizeOf = async () => {
    const res = await fetch(`${API}/lessons/${lesson.lessonId}/snapshot`, {
      headers: { Authorization: `Bearer ${lesson.sessionJwt}` },
    });
    const body = (await res.json()) as {
      snapshot: { canvasState: Record<string, { width: number }> } | null;
    };
    return Object.values(body.snapshot?.canvasState ?? {})[0]?.width;
  };

  // Select it, then drag the transformer's bottom-right handle outwards.
  await page.mouse.click(box.x + 260, box.y + 220);
  const undo = page.getByRole("button", { name: "Undo (Cmd+Z)" });
  await expect(undo).toBeEnabled();

  const corner = { x: box.x + 260 + 95, y: box.y + 220 + 95 };
  await page.mouse.move(corner.x, corner.y);
  await page.mouse.down();
  await page.mouse.move(corner.x + 60, corner.y + 60, { steps: 6 });
  await page.mouse.up();

  // Leaving flushes the snapshot, which is how the stored size becomes visible.
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect.poll(sizeOf, { timeout: 15_000 }).toBeGreaterThan(190);
});

test("the transform handles stay around the element after a resize", async ({
  page,
  context,
}) => {
  await signIn(context, lesson.sessionJwt);
  const canvas = await openCanvas(page);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas has no box");

  await page.getByRole("button", { name: "Sticky note (S)" }).click();
  await page.mouse.click(box.x + 260, box.y + 220);
  await page.keyboard.press("Escape");
  await page.mouse.click(box.x + 260, box.y + 220);

  const corner = { x: box.x + 260 + 95, y: box.y + 220 + 95 };
  await page.mouse.move(corner.x, corner.y);
  await page.mouse.down();
  await page.mouse.move(corner.x + 70, corner.y + 70, { steps: 8 });
  await page.mouse.up();

  // Konva caches the attached node's rect; without forceUpdate the handles
  // keep surrounding the pre-resize box.
  const gap = await page.evaluate(() => {
    const konva = (window as unknown as { Konva?: { stages: unknown[] } })
      .Konva;
    type Rect = { x: number; y: number; width: number; height: number };
    type Node = {
      getClientRect: (opts?: { skipShadow?: boolean }) => Rect;
      getType: () => string;
      id: () => string;
    };
    const stage = konva?.stages[0] as
      | { find: (selector: string) => Node[] }
      | undefined;
    // `.back` is the transformer's border. Its full client rect would also
    // include the rotate handle, which sits 50px outside the box by design.
    const transformer = stage?.find(".back")[0];
    const group = stage?.find("Group").find((node) => node.id().length > 0);
    if (!transformer || !group) return null;
    const a = transformer.getClientRect({ skipShadow: true });
    const b = group.getClientRect({ skipShadow: true });
    return Math.max(Math.abs(a.width - b.width), Math.abs(a.height - b.height));
  });

  expect(gap).not.toBeNull();
  expect(gap ?? 999).toBeLessThan(12);
});

test("the text editor sits on a rotated element, not beside it", async ({
  page,
  context,
}) => {
  const sticky = {
    id: "rot1",
    type: "sticky",
    x: 160,
    y: 140,
    rotation: 28,
    zIndex: 1,
    createdBy: "tutor",
    createdAt: 1,
    width: 200,
    height: 200,
    content: "hello",
    color: "yellow",
  };
  await fetch(`${API}/lessons/${lesson.lessonId}/snapshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lesson.sessionJwt}`,
    },
    body: JSON.stringify({ canvasState: { rot1: sticky } }),
  });

  await signIn(context, lesson.sessionJwt);
  const canvas = await openCanvas(page);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas has no box");

  await page.mouse.dblclick(box.x + 260, box.y + 260);
  const editor = page.getByRole("textbox", { name: "Edit canvas text" });
  await expect(editor).toBeVisible();

  const gap = await page.evaluate((canvasBox) => {
    type Rect = { x: number; y: number; width: number; height: number };
    type Node = {
      getClientRect: (o?: { skipShadow?: boolean }) => Rect;
      id: () => string;
    };
    const stage = (
      window as unknown as {
        Konva?: { stages: { find: (s: string) => Node[] }[] };
      }
    ).Konva?.stages[0];
    const group = stage?.find("Group").find((node) => node.id().length > 0);
    const area = document.querySelector("textarea");
    if (!group || !area) return null;

    const shape = group.getClientRect({ skipShadow: true });
    const shapeCentre = {
      x: canvasBox.x + shape.x + shape.width / 2,
      y: canvasBox.y + shape.y + shape.height / 2,
    };
    const rect = area.getBoundingClientRect();
    const areaCentre = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };
    return Math.hypot(
      shapeCentre.x - areaCentre.x,
      shapeCentre.y - areaCentre.y,
    );
  }, box);

  expect(gap).not.toBeNull();
  expect(gap ?? 999).toBeLessThan(12);
});

test("text resizes the way editors do: sides re-wrap, corners scale", async ({
  page,
  context,
}) => {
  const seed = {
    id: "t1",
    type: "text",
    x: 120,
    y: 120,
    rotation: 0,
    zIndex: 1,
    createdBy: "tutor",
    createdAt: 1,
    width: 300,
    height: 40,
    content: "the quick brown fox jumps over the lazy dog",
    fontSize: 20,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "--text-primary",
  };
  await fetch(`${API}/lessons/${lesson.lessonId}/snapshot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lesson.sessionJwt}`,
    },
    body: JSON.stringify({ canvasState: { t1: seed } }),
  });

  await signIn(context, lesson.sessionJwt);
  const canvas = await openCanvas(page);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas has no box");

  const stored = () =>
    page.evaluate(() => {
      type Node = { id: () => string; getAttr: (k: string) => unknown };
      const stage = (
        window as unknown as {
          Konva?: { stages: { find: (s: string) => Node[] }[] };
        }
      ).Konva?.stages[0];
      const text = stage?.find("Text")[0];
      return text
        ? {
            fontSize: text.getAttr("fontSize") as number,
            width: text.getAttr("width") as number,
          }
        : null;
    });

  await page.mouse.click(box.x + 200, box.y + 130);
  const before = await stored();
  expect(before?.fontSize).toBe(20);

  // Ask Konva where its handles are rather than guessing, since the box height
  // now follows the wrapped text.
  const anchor = (name: string) =>
    page.evaluate((selector) => {
      type Node = { getAbsolutePosition: () => { x: number; y: number } };
      const stage = (
        window as unknown as {
          Konva?: { stages: { findOne: (s: string) => Node | undefined }[] };
        }
      ).Konva?.stages[0];
      const node = stage?.findOne(selector);
      return node ? node.getAbsolutePosition() : null;
    }, name);

  const right = await anchor(".middle-right");
  expect(right).not.toBeNull();

  // Narrows the column: text re-wraps, type stays put.
  await page.mouse.move(box.x + (right?.x ?? 0), box.y + (right?.y ?? 0));
  await page.mouse.down();
  await page.mouse.move(
    box.x + (right?.x ?? 0) - 120,
    box.y + (right?.y ?? 0),
    {
      steps: 6,
    },
  );
  await page.mouse.up();

  const afterSide = await stored();
  expect(afterSide?.fontSize).toBe(20);
  expect(afterSide?.width ?? 0).toBeLessThan(before?.width ?? 0);

  // Corner: the type itself grows.
  const corner = await anchor(".bottom-right");
  expect(corner).not.toBeNull();
  await page.mouse.move(box.x + (corner?.x ?? 0), box.y + (corner?.y ?? 0));
  await page.mouse.down();
  await page.mouse.move(
    box.x + (corner?.x ?? 0) + 100,
    box.y + (corner?.y ?? 0) + 60,
    { steps: 6 },
  );
  await page.mouse.up();

  await expect.poll(async () => (await stored())?.fontSize).toBeGreaterThan(20);
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

test("a peer sees a resize while it is happening", async ({ browser }) => {
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

  const box = await tutorPage.locator("canvas").first().boundingBox();
  if (!box) throw new Error("canvas has no box");

  await tutorPage.getByRole("button", { name: "Rectangle (R)" }).click();
  await tutorPage.mouse.click(box.x + 200, box.y + 200);
  await tutorPage.mouse.click(box.x + 260, box.y + 240);

  const peerWidth = () =>
    peerPage.evaluate(() => {
      type Node = {
        getClientRect: (o?: { skipShadow?: boolean }) => { width: number };
        id: () => string;
      };
      const stage = (
        window as unknown as {
          Konva?: { stages: { find: (s: string) => Node[] }[] };
        }
      ).Konva?.stages[0];
      const group = stage?.find("Group").find((node) => node.id().length > 0);
      return group ? group.getClientRect({ skipShadow: true }).width : null;
    });

  await expect.poll(peerWidth, { timeout: 10_000 }).toBeGreaterThan(150);
  const settled = await peerWidth();

  // Pointer stays DOWN: the peer must follow the gesture, not just its result.
  const corner = { x: box.x + 200 + 180, y: box.y + 200 + 120 };
  await tutorPage.mouse.move(corner.x, corner.y);
  await tutorPage.mouse.down();
  await tutorPage.mouse.move(corner.x - 90, corner.y - 60, { steps: 8 });

  await expect
    .poll(peerWidth, {
      message: "peer saw nothing until the handle was released",
      timeout: 10_000,
    })
    .toBeLessThan((settled ?? 0) - 40);

  await tutorPage.mouse.up();
  await tutor.close();
  await peer.close();
});

test("a peer can see what the other person has selected", async ({
  browser,
}) => {
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

  const box = await tutorPage.locator("canvas").first().boundingBox();
  if (!box) throw new Error("canvas has no box");

  await tutorPage.getByRole("button", { name: "Rectangle (R)" }).click();
  await tutorPage.mouse.click(box.x + 240, box.y + 200);
  await tutorPage.keyboard.press("Escape");

  // Only rects owned by an element: the transformer's anchors are also Rects
  // and come and go with what it is attached to.
  const peerRects = () =>
    peerPage.evaluate(() => {
      type Node = { getParent: () => { getClassName: () => string } | null };
      const stage = (
        window as unknown as {
          Konva?: { stages: { find: (s: string) => Node[] }[] };
        }
      ).Konva?.stages[0];
      return (stage?.find("Rect") ?? []).filter(
        (rect) => rect.getParent()?.getClassName() === "Group",
      ).length;
    });

  await expect.poll(peerRects).toBeGreaterThan(0);
  const before = await peerRects();

  await tutorPage.mouse.click(box.x + 240, box.y + 200);

  // The outline the other side draws is one more Rect than was there before.
  await expect
    .poll(peerRects, {
      message: "the other person's selection never appeared",
      timeout: 10_000,
    })
    .toBe(before + 1);

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
