import { defineConfig } from "drizzle-kit";

// drizzle-kit does not resolve the "@/" alias, so schema files use relative imports only.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  // Migrations need a direct connection: poolers (PgBouncer, Neon pooled URLs) do not suit DDL.
  dbCredentials: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      "",
  },
  strict: true,
  verbose: true,
});
