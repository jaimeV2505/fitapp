/**
 * pnpm db:baseline
 *
 * Moves a database that was created with `drizzle-kit push` onto versioned migrations without touching
 * its data: it records the migrations in ./drizzle as already applied. It does nothing when:
 *   - the database is empty (a fresh database is built by `pnpm db:migrate` as usual), or
 *   - migrations are already recorded.
 * Safe to run on every start.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

interface JournalEntry {
  idx: number;
  when: number;
  tag: string;
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const journalPath = resolve(__dirname, "../drizzle/meta/_journal.json");
  if (!existsSync(journalPath)) {
    console.log("[baseline] No migrations in ./drizzle yet. Run `pnpm db:generate` first.");
    return;
  }
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as { entries: JournalEntry[] };

  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    const [existing] = await sql<{ present: string | null }[]>`select to_regclass('public."user"')::text as present`;
    if (!existing?.present) {
      console.log("[baseline] Empty database: nothing to baseline.");
      return;
    }

    await sql`create schema if not exists drizzle`;
    await sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`;
    const [count] = await sql<{ n: number }[]>`select count(*)::int as n from drizzle.__drizzle_migrations`;
    if ((count?.n ?? 0) > 0) {
      console.log("[baseline] Migrations already recorded.");
      return;
    }

    // Same hash drizzle's migrator computes: sha256 of the SQL file.
    for (const entry of journal.entries) {
      const file = resolve(__dirname, `../drizzle/${entry.tag}.sql`);
      const hash = createHash("sha256").update(readFileSync(file, "utf8")).digest("hex");
      await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${hash}, ${entry.when})`;
    }
    console.log(`[baseline] Existing database adopted: ${journal.entries.length} migration(s) marked as applied.`);
  } finally {
    await sql.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
