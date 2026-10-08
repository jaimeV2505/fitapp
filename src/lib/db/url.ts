/**
 * Which connection string to use. Plain TypeScript with no imports, so drizzle-kit, the app and the scripts
 * all resolve it the same way.
 *
 * - Direct (unpooled) connection: migrations and other scripts (DDL does not suit poolers).
 * - Pooled connection: the running app (many short-lived serverless instances).
 * Vercel's Postgres integrations name them DATABASE_URL / DATABASE_URL_UNPOOLED or POSTGRES_URL / POSTGRES_URL_NON_POOLING.
 */
type Env = Record<string, string | undefined>;

const clean = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim().replace(/^(["'])(.*)\1$/, "$2").trim();
  return trimmed ? trimmed : undefined;
};

export function pooledDatabaseUrl(env: Env = process.env): string | undefined {
  return clean(env.DATABASE_URL) ?? clean(env.POSTGRES_URL);
}

export function directDatabaseUrl(env: Env = process.env): string | undefined {
  return clean(env.DATABASE_URL_UNPOOLED) ?? clean(env.POSTGRES_URL_NON_POOLING) ?? pooledDatabaseUrl(env);
}

/** "host/database" without user or password, safe to print in logs. */
export function describeDatabaseUrl(url: string | undefined): string {
  if (!url) return "(not set)";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "(not a valid URL)";
  }
}

/** Neon's pooled hosts add "-pooler" to the endpoint name; the rest of the host is the same database. */
export function sameDatabaseHost(a: string, b: string): boolean {
  try {
    const norm = (url: string) => new URL(url).hostname.replace("-pooler", "");
    return norm(a) === norm(b);
  } catch {
    return false;
  }
}
