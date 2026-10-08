#!/bin/sh
# Backs up the Docker development database to ./backups (custom-format pg_dump, verified, rotated).
#   pnpm db:backup
# Options (environment): BACKUP_DIR (default backups), BACKUP_KEEP (default 14), POSTGRES_USER/POSTGRES_DB.
set -eu

BACKUP_DIR="${BACKUP_DIR:-backups}"
KEEP="${BACKUP_KEEP:-14}"
DB_SERVICE="${DB_SERVICE:-postgres}"
DB_USER="${POSTGRES_USER:-fitapp}"
DB_NAME="${POSTGRES_DB:-fitapp}"

mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/fitapp-$(date +%Y%m%d-%H%M%S).dump"

echo "Backing up '$DB_NAME' to $FILE ..."
docker compose exec -T "$DB_SERVICE" pg_dump -U "$DB_USER" -d "$DB_NAME" --format=custom --no-owner > "$FILE.partial"
mv "$FILE.partial" "$FILE"

# A backup you have not read back is not a backup: make sure the archive is valid.
docker compose exec -T "$DB_SERVICE" pg_restore --list < "$FILE" > /dev/null
echo "OK: $(du -h "$FILE" | cut -f1)"

# Keep only the newest $KEEP backups.
ls -1t "$BACKUP_DIR"/fitapp-*.dump 2>/dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do
  rm -f "$old"
  echo "Removed old backup: $old"
done
