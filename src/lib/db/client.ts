import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

type SqlClient = ReturnType<typeof postgres>;

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __pgClient?: SqlClient };

const client: SqlClient =
  globalForDb.__pgClient ??
  postgres(env.DATABASE_URL, {
    max: env.NODE_ENV === "production" ? 5 : 10,
    // Compatible with pooled connections (PgBouncer / serverless Postgres providers).
    prepare: false,
  });

if (env.NODE_ENV !== "production") globalForDb.__pgClient = client;

export const db = drizzle(client, { schema });

export type Database = typeof db;
/** The transaction handle passed to `db.transaction(async (tx) => ...)`. */
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
/** Anything that can run queries: the pool or a transaction. */
export type DbExecutor = Database | Tx;
