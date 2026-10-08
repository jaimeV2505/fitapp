# Fitapp

Premium, mobile-first fitness tracker: gym workouts with fast set logging, nutrition with meal templates, AI food-photo estimates (Phase 2), body progress and analytics (Phase 3). Built for personal use first, with a multi-user SaaS architecture.

Stack: Next.js 16 (App Router), TypeScript, React 19, Tailwind CSS 4, Framer Motion, PostgreSQL, Drizzle ORM, Zod, Better Auth, pnpm. See `docs/architecture.md`.

> Status: Phase 1, workout slice written. Read `docs/context/current-state.md` for what has and has not been verified.

## Quick start with Docker

```bash
cp .env.example .env            # optional: compose has working dev defaults
docker compose up --build
```

Open http://localhost:3001 (change it with `APP_PORT` in `.env`), create an account (the first sign-up gets your starter routine and meal templates), then open **Workout**.

The app container waits for Postgres, applies the schema, seeds the exercise and food catalogs, then starts `next dev` with hot reload. Postgres data persists in the `postgres-data` volume (`docker compose down -v` wipes it).

## Local development without Docker for the app

Requires Node 22+ and pnpm 10 (`corepack enable`).

```bash
pnpm install                    # commit the generated pnpm-lock.yaml
cp .env.example .env            # set BETTER_AUTH_SECRET: openssl rand -base64 32
docker compose up -d postgres   # Postgres on localhost:5432
pnpm db:generate                # first time, or after schema changes: creates ./drizzle (commit it)
pnpm db:baseline && pnpm db:migrate   # adopt an existing dev DB if needed, then apply migrations
pnpm db:seed                    # catalogs + provision existing users (idempotent)
pnpm dev
```

Quality checks: `pnpm check` (see Testing below).

## Food photo estimates (Claude vision)

1. Create an API key at console.anthropic.com and put it in `.env` as `ANTHROPIC_API_KEY` (never commit it, never expose it to the browser).
2. Restart: `docker compose up -d` (or restart `pnpm dev`).
3. Nutrition -> **Food photo**. The photo is downsized in your browser, sent to your server, validated, then analysed by Claude. You review and edit every number before saving. Meals saved this way are labelled **AI estimated** with a confidence level.

Photos are sent to Anthropic for analysis and stored through the configured storage driver (`STORAGE_DRIVER`). Estimates are approximate by nature. The default model is set with `ANTHROPIC_MODEL`.

## Exercise photos

Demo photos and instructions come from the public-domain [free-exercise-db](https://github.com/yuhonas/free-exercise-db). The repo ships best-effort matches; to verify and refresh them against the live dataset:

```bash
pnpm media:sync     # matches your exercises, checks the photos exist, writes exercise-media.json
pnpm db:seed        # copies the media into the database (docker compose restart app does the same)
```

Any exercise without a working photo shows a drawn fallback tile.

## Exercise library (all exercises)

```bash
pnpm media:library   # downloads free-exercise-db and maps ~600 strength exercises
pnpm db:seed         # loads them; browse at /library
```

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes | Postgres connection string |
| `BETTER_AUTH_SECRET` | yes | 32+ char random secret for sessions |
| `BETTER_AUTH_URL` | yes in prod | Public base URL of the app |
| `ALLOW_SIGNUP` | no (default `true`) | Set `false` after creating your account to close registration |
| `DEFAULT_TIMEZONE` | no (default `UTC`) | Timezone given to new accounts (IANA name, e.g. `Europe/Stockholm`) |
| `ANTHROPIC_API_KEY` | Phase 2 | Server-side only. Never expose to the browser |
| `STORAGE_DRIVER` | Phase 2 | `local` (dev) or `vercel-blob` (prod) |
| `LOCAL_STORAGE_DIR` | Phase 2 | Upload directory for the local driver |
| `BLOB_READ_WRITE_TOKEN` | Phase 2 + `vercel-blob` | Vercel Blob token |

Invalid or missing variables fail fast at startup with a readable message (`src/lib/env.ts`).

## Database

```bash
pnpm db:generate   # schema change -> versioned SQL migration in ./drizzle (review it, commit it)
pnpm db:migrate    # apply pending migrations
pnpm db:baseline   # adopt an existing dev database onto migrations (safe, automatic in Docker)
pnpm db:seed       # built-in exercises/foods + starter routine for users without one
pnpm db:studio     # browse data
```

The Docker dev container applies migrations on every start (and creates the first one if `./drizzle` is empty: commit that folder). Full workflow, safe-change rules and production notes: `docs/runbooks/database.md`. Schema and design: `docs/database.md`.

## Backups

```bash
pnpm db:backup          # dump to ./backups (validated, newest 14 kept)
pnpm db:verify-backup   # restore the newest one into a throwaway database and count rows
```

Restore and production backup guidance: `docs/runbooks/database.md`.

## Testing

```bash
pnpm check              # typecheck + lint + unit tests
pnpm test:e2e:docker    # Playwright in a container against the running app (docker compose up -d first)
pnpm db:clean-e2e       # remove the throwaway accounts the tests created
# or on your machine: pnpm e2e:install once, then pnpm test:e2e
```

Details and CI: `docs/runbooks/testing.md`.

## Deploying (GitHub, then Vercel)

Step by step, with the environment variables and troubleshooting: `docs/runbooks/deploy.md`. In short: run `docker compose exec app pnpm typecheck && docker compose exec app pnpm lint`, push to a private GitHub repository, import it in Vercel, connect Neon (Postgres) and Blob, set the variables, deploy. The production build applies migrations and seeds the catalogs. Create your account, then set `ALLOW_SIGNUP=false`.

## Production Docker image

```bash
docker build --target runner -t fitapp .
docker run -p 3000:3000 -e DATABASE_URL=... -e BETTER_AUTH_SECRET=... -e BETTER_AUTH_URL=https://your.domain fitapp
```

## Project docs

- `docs/motion.md`: the motion system (Motion for React, GSAP for one sequence, reduced-motion policy)

- `docs/runbooks/`: database (migrations, backups), testing (Vitest, Playwright, CI) and deploy (GitHub, Vercel)
- `docs/architecture.md`: layers, decisions, security, offline behaviour, risks
- `docs/product.md`: vision, screens, assumptions about your seed data, roadmap
- `docs/database.md`: schema, history snapshots, indexes
- `docs/decisions/`: ADRs
- `CLAUDE.md`, `docs/context/`, `docs/handoffs/`, `docs/tasks/`: working memory for future sessions
