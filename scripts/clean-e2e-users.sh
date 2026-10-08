#!/bin/sh
# The end-to-end tests sign up throwaway accounts (e2e-...@example.test) in the dev database.
# This removes them and everything they own (all user data cascades). Your own account is untouched.
set -eu
DB_SERVICE="${DB_SERVICE:-postgres}"
DB_USER="${POSTGRES_USER:-fitapp}"
DB_NAME="${POSTGRES_DB:-fitapp}"
docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$DB_NAME" -tA \
  -c "delete from \"user\" where email like 'e2e-%@example.test'; select 'removed test accounts';"
