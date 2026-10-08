# Current state

Last updated: 2026-10-08 (session 6)

## Built (code written)

- Project scaffolding: Next 16, TS strict, Tailwind 4, ESLint, Vitest, Playwright config, Docker, Vercel config, env validation.
- Database schema for all required entities (`src/lib/db/schema`), including nutrition, body, settings, photo analyses.
- Seed data and provisioning: 27 built-in exercises, owner's 5-day routine with RIR metadata, 12 foods, 6 meal templates incl. the high calorie shake.
- Auth foundation (Better Auth, email + password), sign-in/up page, session helpers.
- App shell, design tokens, bottom nav (mobile) / side rail (desktop), page transition.
- Workouts vertical slice: start/resume, snapshot session creation, logger with prefilled set editor, rest timer, optimistic UI + persistent sync queue, finish/discard, summary, history, dashboard basics.

## Session 2: visuals and dynamics (code written, not yet run)

- Exercise photos: public-domain free-exercise-db (Unlicense). `src/data/starter/exercise-media.json` holds best-effort ids; `pnpm media:sync` verifies/matches them online and also pulls instructions; `pnpm db:seed` copies media into `exercises.image_urls`, `image_url`, `instructions` (new column `image_urls`: apply with `db:push`/migration).
- Exercise detail sheet (vaul): photo gallery that cross-fades start/end position, front/back muscle map (react-body-highlighter), your records (heaviest, estimated 1RM via Epley, best volume), history chart (recharts), instructions.
- Progress page: this-week tiles, weekly volume bar chart (8 weeks), sets per muscle this week (from session snapshots), history.
- Dynamics: animated numbers (NumberFlow, count-up), one staggered entrance per screen, confetti on workout finish (respects reduced motion), sonner toasts when an exercise is done, skeleton loading state, thumbnails in exercise cards, dashboard hero and workout hub.
- New pure code with tests: exercise history/records, week filling.

## Session 3: design system, weekly routine, nutrition (code written, not yet run)

- **Design: "Iron & ink".** Navy ink from engraved gym illustrations + Olympic plate colours as semantic palette (yellow = primary action in dark / ink in light, green = completed, blue = data, red = danger). Fonts: Barlow Condensed (headings, numbers) + Archivo. Dark is the default theme. Hatch texture on hero panels. Exercise photos are printed as navy duotone (`.ink-photo`).
- **Weekly routine** (`/workout`): five plate-coloured day discs (Mon red, Tue blue, Wed yellow, Thu green, Fri white). Pick any day, see its exercises (photo, sets x reps, RIR) and start it. Today is marked.
- **Nutrition slice** (`/nutrition`, `/nutrition/foods`): daily macro dashboard with targets (user-entered), date navigation, meal log, log meal from templates (option groups like water/milk, editable amounts, live macros) or custom meals, foods manager with copy-on-write for built-in foods, dashboard card on Home. Nutrition is always computed on the server and copied into the meal.
- **Exercise library** (`/library`): search/filter every exercise with photos and detail sheet. Load the full free-exercise-db with `pnpm media:library` then `pnpm db:seed`.
- Pure code with new tests: macros/template option resolution (9 tests).

## Session 4: body, records, progression, plan editor, food photos (code written, not yet run)

- **Body** (`/body`): quick log of weight and measurements (waist, chest, arm, leg, body fat), 7/30/90 day chart with a 7-day moving average, change of the smoothed weight, measurement deltas, and average intake of the days you logged meals next to the weight trend (a view of your data, not advice). Latest weight on Home, link from Progress.
- **Personal records**: weight and estimated-1RM records are detected live when you complete a set (confetti + toast + haptic), compared with earlier sessions and sets already done today. At finish they are stored in `progress_metrics` and shown on the summary and under Progress. The first session of an exercise never fires a record.
- **Progression suggestions**: double progression. If every set (or all but one) at the top weight reached the top of the rep range with controlled RIR, the card shows "Ready for X kg" and the set editor offers a "Try X kg" button. Weights are never changed automatically. Too little reserve -> "hold", otherwise "build" guidance.
- **Plan editor** (`/workout/plan`): add exercises from the library, replace, reorder (drag or arrows), change sets and rep range, remove; per-day saving; past workouts keep their snapshots.
- **Food photos** (Nutrition -> Food photo): camera -> downsized in the browser -> server validates the image bytes -> Claude (forced structured tool output) -> Zod validation + sanity checks -> you edit foods, grams, calories and macros -> saved as "AI estimated" with confidence. Photos are stored through the StorageProvider (local in dev, Vercel Blob in prod) and served only to their owner. Needs `ANTHROPIC_API_KEY`. Cost controls: 8/min and 60/day per user.
- New pure code with tests: body series/moving average, records, progression, AI estimate normalization, image sniffing (84+ tests).

## Session 5: library, custom exercises, camera in Log meal, motion system (code written, not yet run)

- **Camera inside Log meal**: the Log meal sheet now starts with a "Take a photo" option that hands over to the AI estimate flow (still needs `ANTHROPIC_API_KEY`). The separate "Food photo" button remains.
- **Exercise library**: the Docker entrypoint imports the free-exercise-db library automatically on first run (needs internet), now including plyometrics; `pnpm media:library` prints exercises per muscle. Muscles with fewer than 30 in the dataset (typically adductors, forearms, calves) are reported. **Create your own exercise** from the picker in Edit routine fills any gap.
- **Motion system** (`docs/motion.md`): `motion` package replaces `framer-motion`; tokens, variants, provider, hooks in `src/lib/motion`; GSAP only for the finished-workout timeline. Applied to the Workout screen, page transitions and the bottom navigation first.

## Session 6: quality and base (roadmap step 1; code written, not yet run)

- **Versioned migrations**: the dev entrypoint no longer uses `push --force`. If `./drizzle` is empty it generates `0000_init`, `db:baseline` adopts the existing dev database without touching data, then `db:migrate` runs. **Commit `drizzle/`.** Runbook: `docs/runbooks/database.md`.
- **Playwright**: 8 end-to-end tests of the critical flows (auth, log a set + reload + finish + resume, offline sync, meal from template + delete, targets, weigh-in, plan editor). Each test signs up its own account. Runbook: `docs/runbooks/testing.md`.
- **CI**: `.github/workflows/ci.yml` (typecheck, lint, unit tests, migrate an empty Postgres, seed, build, start, e2e).
- **Backups**: `pnpm db:backup` (validated, rotated), `pnpm db:verify-backup` (restore into a throwaway DB and count rows), `scripts/restore-db.sh` (safe by default). Production guidance and a scheduled-dump example are in the runbook.
- `pnpm check` runs typecheck + lint + unit tests.

## Session 7: deploy preparation (written, not yet run)

- Deploy runbook `docs/runbooks/deploy.md` (GitHub private repo -> Vercel + Neon + Blob). `vercel.json` uses `scripts/vercel-build.sh`: production builds migrate and seed first, previews never touch a database. Migrations use `DATABASE_URL_UNPOOLED` when present. Preview deployments sign in at their own URL (`appUrl`). `maxDuration = 60` on the nutrition page for photo estimates.
- Open item: the whole project has never been type-checked by `tsc` (no network where it was written). Run `docker compose exec app pnpm typecheck` and `pnpm lint` before the first push; Vercel's `next build` fails on type errors.

## Session 8: performance and Spanish (written; run typecheck/lint/test before pushing)

- **Performance**: per-request cache of user settings, no account re-check per request, Home streams its cards with Suspense, exercise photos from jsDelivr, lazy recharts / detail sheet, `optimizePackageImports`. `vercel.json` no longer pins a function region: set it in Vercel to match the Neon region (most likely cause of slowness). See `docs/runbooks/performance.md`.
- **Spanish** (`docs/i18n.md`): own i18n module (typed dictionaries, ICU plurals, cookie, switcher on Profile and sign-in), ~430 messages, localized dates/numbers, server errors translated, Spanish names for the routine/foods/templates. Exercise instructions and the extended library names stay English.
- Progression reasons are now structured (key + params) instead of English sentences.

## Session 9: visual redesign (written; run typecheck/lint/test, then look at it on a phone)

See `docs/visual-system.md`: depth/grain/slab surfaces, ink stamp, sparklines, plate calculator + warm-ups, week-as-plates, muscle heat map, gold PR plate, shareable workout image, food scan effect, optional plate sound, day colour bar. Pure logic is unit-tested (plates, warm-ups, heat levels, week wheel, trends, sparkline math); the screens and the new SQL (`getExerciseTrendRows`, `listCompletedDates`) have not been run.
- Not done: shared-element transition (see backlog).

## Session 10: 3D body and a big exercise base (written; install, then run typecheck/lint/test)

- **Exercises**: `data/starter/base-exercises.ts` holds 287 curated exercises (22 to 26 per muscle, with Spanish names). `ensureBaseExercises` (run by `db:seed`, so by every production build) tops up only what is missing so every muscle has at least 20 built-in exercises in the picker, without duplicating the library. They have no photos or instructions (the library ones do).
- **3D body** (`docs/visual-system.md`): react-three-fiber viewer on Progress, stylised body by default, a real `public/models/anatomy.glb` is picked up automatically (names matched in `domain/glb.ts`; `pnpm model:check`). **New dependencies**: `three`, `@react-three/fiber`, `@types/three`: update and commit `pnpm-lock.yaml`.
- No real anatomy model is bundled (it could not be downloaded where this was written): the model, its licence and `MODEL_CREDIT` are still to do.
- Unverified: the 3D scene, its dependencies with React 19.2 / Next 16 / Turbopack, and the seed top-up against a real database.

## Delivery notes

The zips that accompany a session leave out the files that only exist on the owner's machine or in git: `drizzle/` (migrations) and `src/data/starter/exercise-library.json` (generated by `pnpm media:library`; the copy inside the zip would be an empty list). Never restore them from a zip.

## Verified

- Pure code compiled with TypeScript strict + `noUncheckedIndexedAccess` and unit tests run (116 tests: blueprint, metrics, formatting, prefill, logger state, persistent queue, sync engine, time helpers, exercise history, week filling).

## NOT verified (authoring sandbox had no network)

- `pnpm install`, `next build`, `tsc` across the whole project, ESLint, `drizzle-kit generate`, running the app, Better Auth wiring, Drizzle queries against a real database, Playwright.
- First thing next session: `pnpm install && pnpm typecheck && pnpm lint && pnpm test`, then `pnpm db:generate` (commit `drizzle/`), `docker compose up`, walk through sign up -> start workout -> log set -> refresh -> finish.

## Not built yet

- Meal editing after saving (delete + re-log for now), meal template editing UI, settings editing, analytics, progressive overload, charts, food photo AI, PWA, Playwright specs.
