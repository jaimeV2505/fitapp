# 0001 Drizzle ORM instead of Prisma

Status: accepted (2026-10-08)

## Context
Postgres, Next.js on Vercel, local Docker, multi-user later, aggregation-heavy analytics (sets and volume per muscle, averages over time).

## Decision
Use Drizzle ORM with `postgres` (postgres-js) and drizzle-kit migrations.

## Consequences
- Schema is TypeScript: no `generate` step, nothing to run in Docker/Vercel builds before type-checking.
- Queries stay close to SQL (grouping, `FILTER`, `DISTINCT ON`), which analytics and "previous performance" need.
- Smaller serverless footprint; connection settings are explicit (`prepare: false` for pooled connections).
- Less hand-holding than Prisma Studio/relations sugar; `pnpm db:studio` (Drizzle Studio) covers inspection.
- Schema files must use relative imports (drizzle-kit does not resolve `@/`).
