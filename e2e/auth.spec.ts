import { test, expect } from "@playwright/test";

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
