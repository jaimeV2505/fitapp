# Database runbook: migrations and backups

## Migrations (Drizzle, versioned)

The schema lives in `src/lib/db/schema/`. Every change goes through a migration file in `./drizzle`, committed with the code. Never use `drizzle-kit push` against data you care about (`push --force` can drop columns silently).

### Day to day

1. Edit the schema.
2. `pnpm db:generate` (answers a prompt if you renamed something) and **read the generated SQL**.
3. Commit the code and the new file in `./drizzle`.
4. Apply: restart the dev container (the entrypoint runs `db:migrate`) or run `pnpm db:migrate`.

### First time on an existing database (baseline)

A database created before migrations existed (by `push`) already has the tables. On the first start after updating, the entrypoint:

1. generates the initial migration (`drizzle/0000_init.sql`) from the current schema if `./drizzle` is empty,
2. runs `pnpm db:baseline`, which records that migration as already applied without touching any data,
3. runs `pnpm db:migrate` (nothing left to do).

**Commit the `drizzle/` folder afterwards.** Baselining assumes the live database matches the schema the migration was generated from, so do it right after updating, before editing the schema. A fresh database (CI, a new machine) is simply built by `db:migrate`.

### Safe changes (expand, then contract)

- Adding a nullable column or a table: one migration, no downtime.
- Renaming or removing something in use: ship code that no longer needs it first, then drop it in a later migration.
- Making a column `NOT NULL`: backfill first, then constrain.
- Before a risky migration: `pnpm db:backup`, then try it on a copy (`sh scripts/restore-db.sh <dump>` creates `fitapp_restore`; run `DATABASE_URL=.../fitapp_restore pnpm db:migrate`).

### Production

Apply migrations from CI or your machine against the production `DATABASE_URL` **before** deploying the code that needs them: `DATABASE_URL=... pnpm db:migrate`. The app never migrates itself on request.

## Backups

### Development (Docker)

```
pnpm db:backup          # custom-format dump to ./backups, validated, keeps the newest 14
pnpm db:verify-backup   # restores the newest backup into a throwaway database and counts rows
sh scripts/restore-db.sh backups/<file>.dump              # restore into fitapp_restore (safe)
sh scripts/restore-db.sh backups/<file>.dump fitapp       # REPLACE the live database (asks to confirm)
```

`./backups` is git-ignored. It contains personal data (training, weight, meals, food photos are not in the database but their keys are): treat the files like secrets and copy them somewhere off this machine.

### Production

- Prefer the provider's managed backups with point-in-time recovery (Neon, Supabase, RDS, Vercel Postgres via its marketplace provider). Check the retention window and that restores are tested.
- Add an independent logical backup: a scheduled `pg_dump` to object storage you control, encrypted. Example GitHub Actions job (needs `DATABASE_URL`, `BACKUP_BUCKET`, and credentials as secrets):

```yaml
name: Database backup
on:
  schedule: [{ cron: "0 3 * * *" }]
jobs:
  dump:
    runs-on: ubuntu-latest
    steps:
      - run: sudo apt-get update && sudo apt-get install -y postgresql-client-17
      - run: pg_dump "$DATABASE_URL" --format=custom --no-owner -f fitapp.dump
        env: { DATABASE_URL: "${{ secrets.DATABASE_URL }}" }
      - run: aws s3 cp fitapp.dump "s3://${{ secrets.BACKUP_BUCKET }}/fitapp-$(date +%F).dump" --sse AES256
```

- Food photos live in object storage (Vercel Blob or similar), not in Postgres. Back them up or enable versioning there too.
- Keep daily backups for 14 days, weekly for 8 weeks, monthly for a year.

### Restore drill (do it once a month)

1. `pnpm db:backup`
2. `pnpm db:verify-backup` and check the counts look right.
3. Write down how long it took and anything surprising.

A backup that has never been restored is a hope, not a backup.
