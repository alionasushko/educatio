import { test, expect } from "./helpers/test";
import { seedMagicLink } from "./helpers/magic-link";
import { createThrowawayTutor, removeTutor } from "./helpers/tutor";

test("the demo cookie expires with the demo token, not 30 days later", async ({
  page,
  context,
}) => {
  await page.goto("/sign-up");
  const demo = page.getByRole("button", { name: /explore the demo/i });
  await expect(demo).toBeVisible();
  await demo.click();
  await expect(page).toHaveURL(/\/dashboard/);

  const [cookie] = (await context.cookies()).filter(
    (c) => c.name === "educatio_session",
  );
  const days = (cookie!.expires - Date.now() / 1000) / 86_400;
  expect(days).toBeGreaterThan(0.5);
  expect(days).toBeLessThan(1.5);
});

test("a dead session is cleared and sent to sign in, not looped", async ({
  page,
  context,
}) => {
  const API = process.env.E2E_API_URL ?? "http://localhost:3001";
  const issued = await fetch(`${API}/auth/demo`, { method: "POST" });
  const { sessionJwt } = (await issued.json()) as { sessionJwt: string };
  await context.addCookies([
    {
      name: "educatio_session",
      value: sessionJwt,
      url: "http://localhost:3000",
    },
  ]);

  await page.goto("/auth/expired?from=/dashboard");

  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("alert").first()).toContainText(/signed out/i);

  // Without clearing it, proxy.ts keeps admitting the cookie and sign-in
  // bounces straight back to the dashboard — an endless loop.
  const left = (await context.cookies()).filter(
    (cookie) => cookie.name === "educatio_session",
  );
  expect(left).toHaveLength(0);
});

test("a magic link only works in the browser that asked for it", async ({
  browser,
}) => {
  const API = process.env.E2E_API_URL ?? "http://localhost:3001";
  const tutor = await createThrowawayTutor();
  const { token, binding } = await seedMagicLink(tutor.email);

  // Someone else's browser: it has the link but never requested one. This is
  // the login-CSRF case — an attacker sends you a link to their own account.
  const stranger = await browser.newContext();
  const attacked = await stranger.newPage();
  await attacked.goto(`/auth/callback?token=${token}`);

  await expect(attacked).toHaveURL(/\/sign-in/);
  expect(
    (await stranger.cookies()).filter((c) => c.name === "educatio_session"),
  ).toHaveLength(0);
  await stranger.close();

  // The api is the authority: web refusing early would hide a missing check
  // there, so ask it directly with the wrong half.
  const direct = await fetch(`${API}/auth/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, binding: "not-the-binding-you-were-given" }),
  });
  expect(direct.status).toBe(401);

  // The browser that asked for it holds the other half, and neither refusal
  // above may have burned the token.
  const owner = await browser.newContext();
  await owner.addCookies([
    {
      name: "educatio_link_binding",
      value: binding,
      url: "http://localhost:3000",
    },
  ]);
  const page = await owner.newPage();
  await page.goto(`/auth/callback?token=${token}`);

  await expect(page).not.toHaveURL(/\/sign-in/);
  expect(
    (await owner.cookies()).filter((c) => c.name === "educatio_session"),
  ).toHaveLength(1);
  await owner.close();
  await removeTutor(tutor);
});

test("a magic link with no token goes back to sign in", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("alert").first()).toContainText(
    /invalid|expired/i,
  );
});

test("setting a password lands you home with a word about it", async ({
  page,
  context,
}) => {
  const API = process.env.E2E_API_URL ?? "http://localhost:3001";

  // A real tutor, not the demo account: that one is read-only, so it cannot
  // change its own password.
  const email = `pw-${Date.now()}@example.com`;
  await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Pat Tutor", email }),
  });

  const { token, binding } = await seedMagicLink(email);
  await context.addCookies([
    {
      name: "educatio_link_binding",
      value: binding,
      url: "http://localhost:3000",
    },
  ]);
  await page.goto(`/auth/callback?token=${token}`);
  await expect(page).toHaveURL(/\/set-password/);

  await page.getByLabel(/password/i).fill("a-long-enough-password");
  await page.getByRole("button", { name: /password$/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/password (set|changed)/i)).toBeVisible();
});
