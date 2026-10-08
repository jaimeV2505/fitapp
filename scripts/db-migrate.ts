/**
 * pnpm db:migrate:ci
 * Applies the versioned migrations in ./drizzle with drizzle's own migrator and prints readable errors.
 * (drizzle-kit's spinner hides the real error in non-interactive build logs.) Same engine, same bookkeeping table.
 */
import "dotenv/config";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { describeDatabaseUrl, directDatabaseUrl } from "../src/lib/db/url";

/** Where the migrations may be: next to the project root (cwd, as drizzle-kit does) or relative to this file. */
function findMigrationsFolder(): string {
  const here = typeof __dirname === "string" ? __dirname : undefined;
  const candidates = [resolve(process.cwd(), "drizzle"), ...(here ? [resolve(here, "../drizzle")] : [])];
  const found = candidates.find((folder) => existsSync(join(folder, "meta", "_journal.json")));
  if (found) return found;

  const list = (dir: string): string => {
    try {
      return readdirSync(dir).slice(0, 25).join(", ") || "(empty)";
    } catch {
      return "(does not exist)";
    }
  };
  throw new Error(
    [
      "Could not find drizzle/meta/_journal.json.",
      `  working directory: ${process.cwd()}`,
      `  script directory:  ${here ?? "(unknown)"}`,
      ...candidates.map((folder) => `  ${folder}: ${list(folder)}`),
      `  project root contains: ${list(process.cwd())}`,
      "  Is the drizzle/ folder committed to git? Check with: git ls-files drizzle",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const url = directDatabaseUrl();
  if (!url) throw new Error("No database URL is set.");
  const migrationsFolder = findMigrationsFolder();
  console.log(`[migrate] Applying migrations from ${migrationsFolder} to ${describeDatabaseUrl(url)} ...`);

  const sql = postgres(url, { max: 1, connect_timeout: 20, onnotice: () => undefined });
  try {
    await migrate(drizzle(sql), { migrationsFolder });
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
