# Testing runbook

| Layer | Tool | What it protects | Where |
|-------|------|------------------|-------|
| Unit | Vitest | Pure logic: progression, records, macros, series, sync queue, time | `src/**/*.test.ts` |
| End to end | Playwright (mobile Chrome) | The flows you rely on in the gym | `tests/e2e/*.spec.ts` |
| Static | TypeScript strict + ESLint | Type errors, unused code, hook rules | `pnpm typecheck`, `pnpm lint` |

`pnpm check` runs typecheck, lint and unit tests.

## Running the end-to-end tests

They run against a live app and create their own throwaway accounts (registration must be open, which it is by default in development).

```
docker compose up -d                 # app on http://localhost:3001
pnpm test:e2e:docker                 # easiest: runs in a container with a browser, nothing to install
pnpm db:clean-e2e                    # afterwards: removes the throwaway test accounts

# or, with Playwright installed on your machine:
pnpm install                         # once, if node_modules on your machine is out of date
pnpm e2e:install                     # once: downloads Chromium (CI uses --with-deps for Linux libraries)
pnpm test:e2e                        # headless
pnpm exec playwright test --ui       # interactive, great for writing tests
E2E_BASE_URL=http://localhost:3000 pnpm test:e2e    # another address
```

The tests run against your development database with throwaway `e2e-...@example.test` accounts; `pnpm db:clean-e2e` removes them. Failures keep a trace and a screenshot: `pnpm exec playwright show-report`.

## What is covered

- Sign up, sign out, sign in, signed-out redirect.
- Start a workout, log a set, reload and still see it, finish with confirmation, resume a running workout.
- Offline: log a set without a connection, see it kept on the device, and watch it sync when the connection returns.
- Nutrition: log a meal from a template and delete it; set daily targets.
- Body: log a weigh-in.
- Routine: add an exercise to a day and save.

## Writing a test

- Sign up through the `test` fixture from `fixtures.ts`; it gives each test its own account.
- Select by role and accessible name (`getByRole("button", { name: "Complete set" })`), not by CSS classes.
- Numbers drawn by the animated-number component can be hard to read as text; assert on plain-text lists instead.
- Never use fixed sleeps. Wait for a visible result.
- Keep a test to one user journey and keep it short; if a test is flaky, fix the cause or delete it.

## CI

`.github/workflows/ci.yml` runs on every push and pull request: install, `pnpm check`, migrate an empty Postgres, seed, build, start the app, run Playwright. It needs `pnpm-lock.yaml` and `drizzle/` committed. Failed runs upload the Playwright report.
