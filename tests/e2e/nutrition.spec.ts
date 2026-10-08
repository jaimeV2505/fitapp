import { expect, test } from "./fixtures";

test("a meal can be logged from a template and deleted", async ({ page }) => {
  await page.goto("/nutrition");

  await page.getByRole("button", { name: /Log meal/ }).click();
  await page.getByRole("button", { name: /^Breakfast/ }).click();
  await page.getByRole("button", { name: "Save meal" }).click();

  await expect(page.getByText("Meal logged")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete Breakfast" })).toBeVisible();

  await page.getByRole("button", { name: "Delete Breakfast" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText(/Nothing logged for this day yet/)).toBeVisible();
});

test("daily targets can be set", async ({ page }) => {
  await page.goto("/nutrition");
  await page.getByRole("button", { name: "Set daily targets" }).click();
  await page.getByLabel("Calories").fill("2800");
  await page.getByLabel("Protein").fill("200");
  await page.getByRole("button", { name: "Save targets" }).click();
  await expect(page.getByText("Targets saved")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit targets" })).toBeVisible();
});
