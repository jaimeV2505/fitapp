/**
 * pnpm db:migrate:ci
 * Applies the versioned migrations in ./drizzle with drizzle's own migrator and prints readable errors.
 * (drizzle-kit's spinner hides the real error in non-interactive build logs.) Same engine, same bookkeeping table.
 */
import "dotenv/config";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { describeDatabaseUrl, directDatabaseUrl } from "../src/lib/db/url";

async function main(): Promise<void> {
  const url = directDatabaseUrl();
  if (!url) throw new Error("No database URL is set.");
  console.log(`[migrate] Applying migrations to ${describeDatabaseUrl(url)} ...`);

  const sql = postgres(url, { max: 1, connect_timeout: 20, onnotice: () => undefined });
  try {
    await migrate(drizzle(sql), { migrationsFolder: resolve(__dirname, "../drizzle") });
    console.log("[migrate] Migrations applied successfully.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const details: string[] = [];
  let current: unknown = error;
  while (current instanceof Error && details.length < 4) {
    const code = "code" in current ? ` [${String((current as { code: unknown }).code)}]` : "";
    details.push(`${current.message}${code}`);
    current = current.cause;
  }
  console.error(`[migrate] FAILED: ${details.join(" <- ")}`);
  process.exit(1);
});
