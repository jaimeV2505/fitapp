#!/bin/sh
# Restores a backup. By default into a SEPARATE database (fitapp_restore) so nothing is overwritten.
#   sh scripts/restore-db.sh backups/fitapp-20261008-120000.dump            # safe: into fitapp_restore
#   sh scripts/restore-db.sh backups/fitapp-20261008-120000.dump fitapp     # REPLACES the live database
set -eu

FILE="${1:?Usage: restore-db.sh <backup file> [target database]}"
DB_SERVICE="${DB_SERVICE:-postgres}"
DB_USER="${POSTGRES_USER:-fitapp}"
DB_NAME="${POSTGRES_DB:-fitapp}"
TARGET="${2:-fitapp_restore}"

[ -f "$FILE" ] || { echo "No such file: $FILE" >&2; exit 1; }

if [ "$TARGET" = "$DB_NAME" ]; then
  echo "This will REPLACE the live database '$DB_NAME' with the contents of $FILE."
  echo "Stop the app first (docker compose stop app) so nothing writes during the restore."
  printf "Type the database name to confirm: "
  read -r answer
  [ "$answer" = "$DB_NAME" ] || { echo "Aborted."; exit 1; }
fi

echo "Restoring $FILE into '$TARGET' ..."
docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"$TARGET\" WITH (FORCE);" -c "CREATE DATABASE \"$TARGET\";"
docker compose exec -T "$DB_SERVICE" pg_restore -U "$DB_USER" -d "$TARGET" --no-owner --exit-on-error < "$FILE"
echo "Done. Database '$TARGET' restored."
