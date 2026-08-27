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
