import { expect, test as plain } from "@playwright/test";
import { PASSWORD, test } from "./fixtures";

test("a new account can sign out and sign back in", async ({ page, email }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/sign-in/);

  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/");
});

plain("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/workout");
  await expect(page).toHaveURL(/sign-in/);
});
