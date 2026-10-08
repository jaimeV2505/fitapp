import { expect, startWorkout, test } from "./fixtures";

test("a logged set survives a reload and the workout can be finished", async ({ page }) => {
  await startWorkout(page);

  await page.getByRole("button", { name: "Complete set" }).click();
  // A completed set chip is labelled "Set 1, <weight> kilograms times <reps>".
  await expect(page.getByRole("button", { name: /^Set 1, / })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: /^Set 1, / })).toBeVisible();

  // Sets are still open, so finishing asks for confirmation first.
  await page.getByRole("button", { name: "Finish workout" }).click();
  await expect(page.getByText(/still open/)).toBeVisible();
  await page.getByRole("button", { name: "Finish workout" }).click();

  await expect(page.getByText("Workout complete")).toBeVisible();
});

test("a running workout can be resumed from the workout screen", async ({ page }) => {
  await startWorkout(page);
  await page.goto("/workout");
  await expect(page.getByText("You have a workout in progress")).toBeVisible();
  await page.getByRole("link", { name: "Resume workout" }).click();
  await expect(page.getByRole("button", { name: "Complete set" })).toBeVisible();
});
