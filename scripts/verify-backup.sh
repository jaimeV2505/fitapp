#!/bin/sh
# Proves a backup is restorable: restores it into a throwaway database, counts rows in the key tables, drops it.
#   pnpm db:verify-backup                      # newest backup
#   sh scripts/verify-backup.sh backups/x.dump
set -eu

BACKUP_DIR="${BACKUP_DIR:-backups}"
DB_SERVICE="${DB_SERVICE:-postgres}"
DB_USER="${POSTGRES_USER:-fitapp}"
FILE="${1:-$(ls -1t "$BACKUP_DIR"/fitapp-*.dump 2>/dev/null | head -n 1)}"
VERIFY_DB="fitapp_verify"

[ -n "$FILE" ] && [ -f "$FILE" ] || { echo "No backup found. Run: pnpm db:backup" >&2; exit 1; }

echo "Verifying $FILE ..."
sh "$(dirname "$0")/restore-db.sh" "$FILE" "$VERIFY_DB" > /dev/null

for table in '"user"' workout_sessions workout_sets meals meal_items body_measurements; do
  count="$(docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d "$VERIFY_DB" -tA -c "select count(*) from $table;")"
  printf "  %-20s %s rows\n" "$table" "$count"
done

docker compose exec -T "$DB_SERVICE" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$VERIFY_DB\" WITH (FORCE);" > /dev/null
echo "OK: the backup restores cleanly."
