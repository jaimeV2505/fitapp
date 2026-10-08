import { expect, test } from "./fixtures";

test("an exercise can be added to a day and saved", async ({ page }) => {
  await page.goto("/workout/plan");

  await page.getByRole("button", { name: "Add exercise" }).click();
  await page.getByLabel("Search exercises").fill("Lat Pulldown");
  await page.getByRole("button", { name: /Lat Pulldown/ }).first().click();

  await page.getByRole("button", { name: /^Save/ }).click();
  await expect(page.getByText("Routine saved")).toBeVisible();
});
