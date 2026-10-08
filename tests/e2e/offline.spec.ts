import { expect, startWorkout, test } from "./fixtures";

test("sets logged without a connection are kept and synced when it returns", async ({ page, context }) => {
  await startWorkout(page);

  await context.setOffline(true);
  await page.getByRole("button", { name: "Complete set" }).click();

  // The set shows as done immediately and the header says it is waiting on this device.
  await expect(page.getByRole("button", { name: /^Set 1, / })).toBeVisible();
  await expect(page.getByText(/Offline · 1 set/)).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByText("All changes saved")).toBeVisible({ timeout: 30_000 });
});
