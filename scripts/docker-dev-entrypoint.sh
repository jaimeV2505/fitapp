#!/bin/sh
# Prepares the dev container: sync deps, apply the schema, seed the catalog.
set -e

# Always sync dependencies: the node_modules volume outlives image rebuilds, so new packages in
# package.json would otherwise be missing. This is a fast no-op when everything is up to date.
echo "[entrypoint] Syncing dependencies..."
pnpm install --prefer-offline

# Versioned migrations (never `push --force`, which can drop data silently).
if [ ! -f drizzle/meta/_journal.json ]; then
  echo "[entrypoint] No migrations yet: generating the initial one from the schema."
  echo "[entrypoint] Commit the ./drizzle folder. Later schema changes: run 'pnpm db:generate'."
  pnpm db:generate --name init
fi
echo "[entrypoint] Adopting an existing database if needed (no-op for fresh ones)..."
pnpm db:baseline
echo "[entrypoint] Applying migrations..."
pnpm db:migrate

# First run: fetch the wide exercise library (photos + how-to for hundreds of exercises). Needs internet.
if [ "$(tr -d ' \n' < src/data/starter/exercise-library.json)" = "[]" ]; then
  echo "[entrypoint] Importing the exercise library (first run)..."
  pnpm media:library || echo "[entrypoint] Library import skipped (no network?). Run 'pnpm media:library' later."
fi

echo "[entrypoint] Seeding catalog..."
pnpm db:seed

exec "$@"
