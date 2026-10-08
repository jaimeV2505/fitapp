import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a running app (docker compose up, or `pnpm build && pnpm start`).
 * Every test signs up its own throwaway account, so tests never depend on your data and can run in any order.
 * Registration must be open (ALLOW_SIGNUP=true), which is the development default.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 7"] } }],
});
