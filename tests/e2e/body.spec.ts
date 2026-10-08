import { expect, test } from "./fixtures";

test("a weigh-in is saved and shown", async ({ page }) => {
  await page.goto("/body");
  await page.getByRole("button", { name: "Log weight" }).click();
  await page.getByLabel("Body weight").fill("74.8");
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  // The entries list is plain text (the headline number is an animated component).
  await expect(page.getByRole("listitem").filter({ hasText: "74.8 kg" })).toBeVisible();
});
