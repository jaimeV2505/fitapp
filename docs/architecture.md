# Architecture

Status: Phase 1 in progress (workout logging slice). See `docs/context/current-state.md` for what is built and verified.

## Goals

- Premium, mobile-first fitness app, usable one-handed in the gym (log a set in 2-3 seconds).
- Single-user today, multi-user SaaS later: every row is owned by a user from day one.
- Pragmatic layering, no enterprise ceremony. Business logic never lives in React components.

## Layers and data flow

```
React component (UI only)
  -> server action            modules/<x>/actions.ts      auth, Zod validation, rate limit
    -> service                modules/<x>/service.ts      business rules, orchestration, errors
      -> domain               modules/<x>/domain/*.ts     pure functions (no I/O), unit tested
      -> repository           modules/<x>/repository.ts   Drizzle queries, row <-> view mapping
        -> PostgreSQL         lib/db/schema/*.ts
```

Rules:

1. Components import actions and view types, never repositories or the database.
2. Services take a `userId` and never trust ids from the client; repositories scope every query by owner.
3. Pure logic (`domain/`) has no imports from Next, React or the database, so it can be tested in isolation and reused client-side.
4. Server actions return `ActionResult<T>` (typed ok/error); unexpected errors are logged server-side and shown generically.
5. Drizzle schema files use relative imports only (drizzle-kit does not resolve the `@/` alias).

## Folder structure

```
src/
  app/                       routes (App Router)
    (auth)/sign-in/
    (app)/                   signed-in area: layout guard + app shell
      page.tsx               Today dashboard
      workout/               hub, [sessionId] logger/summary
      nutrition/  progress/  profile/
    api/auth/[...all]/       Better Auth handler
    api/health/              liveness + DB check
  components/
    ui/                      design-system primitives (button, card, progress ring)
    shell/                   app shell, bottom nav (mobile) / side rail (desktop)
  modules/                   domain modules
    workouts/                actions, service, repository, validators, types, domain/, components/
    exercises/  foods/       built-in catalog seeding
    nutrition/               starter meal templates (UI + logging: next slice)
    users/                   provisioning (settings + starter routine + templates)
    settings/                user settings access
    ai/                      AIProvider interface (Phase 2)
    body/  analytics/        reserved (Phases 1-3)
  lib/
    db/                      client + schema (one file per area)
    auth/                    Better Auth config, client, session helpers
    offline/                 PersistentQueue + SyncEngine (framework-free)
    rate-limit/  storage/    interfaces + in-memory limiter
    env.ts  errors.ts  actions.ts  time.ts  utils.ts
  data/starter/              seed data: exercise catalog, plan, foods, meal templates
scripts/seed.ts              idempotent catalog seed + provisioning of existing users
docs/                        architecture, product, database, ADRs, context, handoffs, tasks
```

## Key decisions

Each has an ADR in `docs/decisions/`.

| # | Decision | Why |
|---|----------|-----|
| 1 | **Drizzle** over Prisma | Schema is plain TypeScript (no codegen step, nothing to regenerate on Vercel or in Docker), SQL-shaped queries suit the aggregation-heavy analytics, light serverless footprint. |
| 2 | **Better Auth** instead of Auth.js | Auth.js is now maintained by the Better Auth project and new projects are steered to Better Auth. Users live in our Postgres, first-class Drizzle adapter, email+password now, OAuth/orgs later. |
| 3 | **Plan layer vs history layer** | Editing a plan can never alter past sessions: sessions copy names, muscles, targets and rest times at start; links back to the plan are nullable `ON DELETE SET NULL`. |
| 4 | **Sets are pre-created** when a workout starts | The UI renders all sets immediately, "complete" is an idempotent update by id, and the offline queue only ever sends "state of set X". |
| 5 | **Optimistic overlay + persistent queue** | UI = server-confirmed state + queued, unsynced sets. Queue lives in localStorage and is retried with backoff. Refresh or dead Wi-Fi loses nothing. |
| 6 | **Local dates** stored with every session, meal and measurement | "Today" and "this week" depend on the user's timezone, not the server's. |
| 7 | **Previous performance prefers the same plan day** | Monday's heavy incline sets are the wrong comparison for Thursday's volume sets; fall back to any day. |
| 8 | Progression is **advisory only** | Suggestions are shown, weights are never changed automatically. |
| 9 | **Exercise photos come from a public-domain dataset**, referenced by URL | No licensing risk and no storage cost now; `exercises.image_urls` can later point at our own storage (StorageProvider). The UI always falls back to a drawn tile if a photo fails. |
| 11 | **Records are measured against finished sessions only**, live in the logger and again (authoritatively) at finish | Instant feedback without a round trip; the stored records come from the server. A first session has nothing to beat. |
| 12 | **AI output is never trusted** | Claude is forced to answer through a tool schema, the result is parsed with Zod, totals are recomputed, items whose calories contradict their macros get low confidence, and the user edits everything before anything is saved. |
| 13 | **Plan editing replaces a day's rows atomically** | History is snapshotted, so deleting plan rows cannot change past sessions. |
| 10 | **Analytics read session snapshots** | Sets per muscle and weekly volume are computed from completed sets and `primary_muscle_snapshot`, not live exercise rows. |

## Offline / poor connectivity (MVP)

- Completing a set updates the screen instantly and enqueues `{setId, weight, reps, rir, completed, completedAt}`.
- `SyncEngine` delivers the queue in order. Outcomes: `ok` (remove), `drop` (server rejected permanently, surface message), `retry` (offline/5xx/rate limit: keep, backoff 2s..30s, also on `online` and tab focus), `halt` (signed out: keep everything).
- Replacing a key while its older version is in flight is safe (`removeIfUnchanged`).
- Finish waits for the queue to drain. Add/remove extra set requires a connection (documented limitation).
- Evolution path to Phase 4: swap `PersistentQueue` storage for IndexedDB and drive `SyncEngine.flush` from a service worker / Background Sync. Callers do not change.

## Security

| Concern | Approach |
|---------|----------|
| Secrets | Validated env (`lib/env.ts`), `.env.example`, nothing `NEXT_PUBLIC_`. Anthropic key is only read server-side (Phase 2). |
| AuthN | Better Auth sessions (httpOnly cookies). `ALLOW_SIGNUP=false` closes registration for single-user deployments. |
| AuthZ | Layout guard is UX only. Every action calls `requireUserOrThrow()`; every query is scoped by `user_id` (set edits also require the session to be `in_progress`). |
| Input | Zod on every action. Numeric ranges bounded. Timestamps from devices are clamped (no far-future completion times). |
| Abuse | `RateLimiter` interface with in-memory implementation; swap for a shared store before running many instances. |
| Uploads (Phase 2) | MIME sniffing, size limit, server-side re-encode, random storage keys, private objects. |
| Headers | `nosniff`, `X-Frame-Options: DENY`, referrer policy, camera permission limited to self. |

## Pluggable providers

`AIProvider` (`modules/ai/provider.ts`) and `StorageProvider` (`lib/storage/types.ts`) are interfaces only for now. Phase 2 adds `AnthropicProvider` and the `local` / `vercel-blob` storage adapters, selected by `STORAGE_DRIVER`. The model response is always parsed with Zod before it reaches the UI.

## Deployment

- **Vercel**: no local filesystem dependency in production; storage adapter swaps to Vercel Blob. Run migrations from CI or a local machine (`DATABASE_URL=... pnpm db:migrate`), not on request.
- **Docker (dev)**: `docker compose up` starts Postgres 17 and the app with hot reload; the entrypoint applies the schema and seeds the catalog.
- **Docker (prod image)**: `Dockerfile` target `runner` builds a standalone Next server.

## Technical risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Code authored without a package install or build (no network in the authoring sandbox) | First `pnpm typecheck`/`build` may surface errors | Pure domain, queue and sync engine are strict-compiled and unit tested; run `pnpm typecheck && pnpm lint && pnpm test` first and fix before building more. |
| Library API drift (Next 16, Better Auth, Zod 4, Drizzle) | Compile errors in glue code | Isolated behind `lib/auth`, `lib/db`, `lib/actions`; versions pinned by lockfile after first install. |
| Photo calorie estimates are inaccurate | User distrust or bad data | Always labelled "AI estimated" with confidence; everything editable before save; raw output never stored as truth. |
| Offline add/remove set | Cannot extend a set list offline | Documented limitation; extra sets can get client-generated ids in Phase 4. |
| Sessions left open | Skews "previous workout" and weekly counts | Sessions older than 18 h are auto-closed when the next workout starts; explicit Discard available. |
| In-memory rate limiter on serverless | Limits are per instance | Interface in place; plug a shared store before multi-user launch. |
| Seed nutrition values are generic | Wrong totals if not edited | Marked `nutrition_source = seed_estimate`; foods are user-editable (editing UI in the nutrition slice). |
