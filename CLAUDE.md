# Fitapp: project guide for Claude sessions

Premium mobile-first fitness tracker (workouts, nutrition, AI food photos, body progress). Personal use first, multi-user SaaS later. Read `docs/context/current-state.md` first, then the latest file in `docs/handoffs/`.

## Commands

```
pnpm install              # first time; commit pnpm-lock.yaml
docker compose up         # Postgres + app with hot reload, applies schema, seeds catalog
pnpm dev                  # app on host (needs DATABASE_URL, see .env.example)
pnpm check                # typecheck + lint + unit tests
pnpm db:generate          # create a migration after schema changes, commit ./drizzle (never push --force)
pnpm db:migrate | db:baseline | db:studio | db:seed
pnpm db:backup | db:verify-backup
pnpm test:e2e             # Playwright against the running app (see docs/runbooks/testing.md)
```

## Architecture rules (see docs/architecture.md)

- Flow: component -> server action -> service -> repository -> DB. Pure logic in `modules/<x>/domain/`.
- No business logic in React components. No DB access outside repositories. No `any`.
- Every action: `requireUserOrThrow()`, Zod parse, rate limit, then service. Every query scoped by `user_id`.
- History is snapshotted (ADR 0003): never join live plan/catalog rows to display or analyse past sessions.
- Never auto-change weights or nutrition targets. AI output is validated with Zod and labelled "AI estimated".
- Schema files: relative imports only. Numeric columns come back as strings: convert in repositories.
- Seed/starter data lives in `src/data/starter/`, never in components.
- Secrets are server-only. Nothing sensitive is `NEXT_PUBLIC_`.

## Conventions

- Motion: import from `motion/react`, take every duration/spring/variant from `src/lib/motion` (see `docs/motion.md`). GSAP only for multi-step timelines. Always keep feedback visible under reduced motion.

- Strict TypeScript with `noUncheckedIndexedAccess`.
- Tests next to code (`*.test.ts`, Vitest). Pure logic gets tests; add Playwright for critical flows.
- UI: design system "Iron & ink" (see current-state). Tokens in `src/app/globals.css`, primitives in `src/components/ui`. Touch targets >= 48 px, large numbers, green only for completed work, motion only to confirm an action, respect reduced motion.
- Document decisions as short ADRs in `docs/decisions/`; update `docs/context/current-state.md` and add a handoff at the end of each session.

## Working agreement with the owner

Build vertically (database -> backend -> action -> UI -> tests), finish one flow before starting another, no fake data to make screens look done, state plainly what was and was not verified.
