/**
 * pnpm db:check
 * Verifies the database connection the way the deployment will use it and explains any failure in plain words.
 * Prints host and database names only, never credentials.
 */
import "dotenv/config";
import postgres from "postgres";
import { describeDatabaseUrl, directDatabaseUrl, pooledDatabaseUrl, sameDatabaseHost } from "../src/lib/db/url";

const NAMES = ["DATABASE_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING"] as const;

async function main(): Promise<void> {
  const direct = directDatabaseUrl();
  const pooled = pooledDatabaseUrl();

  console.log("[db-check] Connection variables present:");
  for (const name of NAMES) console.log(`  ${name.padEnd(26)} ${process.env[name] ? describeDatabaseUrl(process.env[name]) : "(not set)"}`);

  if (!direct) throw new Error("No database URL is set. Connect a Postgres database to this environment (Vercel -> Storage) or set DATABASE_URL.");
  console.log(`[db-check] Migrations will use: ${describeDatabaseUrl(direct)}`);
  console.log(`[db-check] The app will use:    ${describeDatabaseUrl(pooled)}`);

  if (pooled && !sameDatabaseHost(direct, pooled)) {
    throw new Error(
      "The direct and the pooled connection point to DIFFERENT databases. This usually means an old variable is left over from a previous database. " +
        "In Vercel -> Settings -> Environment Variables delete the ones you do not use (keep the pair created by the current Postgres integration).",
    );
  }

  const sql = postgres(direct, { max: 1, connect_timeout: 20, onnotice: () => undefined });
  try {
    const started = Date.now();
    const [info] = await sql<{ db: string; version: string }[]>`select current_database() as db, version() as version`;
    const [tables] = await sql<{ n: number }[]>`select count(*)::int as n from information_schema.tables where table_schema = 'public'`;
    console.log(`[db-check] Connected to "${info?.db}" in ${Date.now() - started} ms (${(info?.version ?? "").split(" on ")[0]}).`);
    console.log(`[db-check] Tables in the public schema: ${tables?.n ?? 0}${(tables?.n ?? 0) === 0 ? " (empty database: migrations will create them)" : ""}.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const cause = error instanceof Error && error.cause instanceof Error ? ` (${error.cause.message})` : "";
  const code = typeof error === "object" && error !== null && "code" in error ? ` [${String((error as { code: unknown }).code)}]` : "";
  console.error(`[db-check] FAILED${code}: ${error instanceof Error ? error.message : String(error)}${cause}`);
  const text = String(error instanceof Error ? error.message : error);
  if (/password authentication failed|28P01/.test(text)) console.error("[db-check] Hint: the user or password in the URL is wrong or was rotated. Reconnect the database integration.");
  if (/ENOTFOUND|getaddrinfo/.test(text)) console.error("[db-check] Hint: the host does not exist. The database was probably deleted or replaced; a stale variable is still set.");
  if (/ETIMEDOUT|timeout|CONNECT_TIMEOUT/.test(text)) console.error("[db-check] Hint: could not reach the database in time. Check that it is not paused and that no IP allow-list blocks Vercel.");
  process.exit(1);
});
