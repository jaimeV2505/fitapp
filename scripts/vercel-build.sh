#!/bin/sh
# Vercel build command.
# Production builds first apply database migrations and the idempotent catalog seed, so the new code
# never goes live against an old schema (the previous deployment keeps serving until this build succeeds).
# Preview builds never touch a database: they only build.
set -eu

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "[vercel-build] Production: checking the database connection..."
  pnpm db:check
  echo "[vercel-build] Production: applying migrations..."
  pnpm db:migrate:ci
  echo "[vercel-build] Production: seeding catalogs (idempotent)..."
  pnpm db:seed
else
  echo "[vercel-build] ${VERCEL_ENV:-local} build: skipping database steps."
fi

pnpm build
