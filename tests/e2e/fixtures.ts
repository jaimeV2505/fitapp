import { expect, test as base, type Page } from "@playwright/test";

export const PASSWORD = "E2e-password-12345";

/** Creates a brand-new account through the UI and leaves the page signed in on Home. */
export async function signUp(page: Page): Promise<string> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Create an account", exact: true }).click();
  await page.getByPlaceholder("Name").fill("E2E Athlete");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder(/^Password/).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  return email;
}

/** `test` with a freshly signed-up account for every test. */
export const test = base.extend<{ email: string }>({
  // The callback is named `provide` (Playwright's docs call it `use`, which the React hooks lint rule mistakes for a hook).
  email: async ({ page }, provide) => {
    await provide(await signUp(page));
  },
});

export { expect };

/** Opens the first day of the routine and starts it (works on any weekday). */
export async function startWorkout(page: Page): Promise<void> {
  await page.goto("/workout");
  await page.getByRole("tab").first().click();
  await page.getByRole("button", { name: /^Start/ }).click();
  await page.waitForURL(/\/workout\/[0-9a-f-]{36}/);
  await expect(page.getByRole("button", { name: "Complete set" })).toBeVisible();
}
