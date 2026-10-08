import { defineConfig } from "drizzle-kit";
import { directDatabaseUrl } from "./src/lib/db/url";

// drizzle-kit does not resolve the "@/" alias, so schema files use relative imports only.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  // Migrations need a direct connection (not a pooler); the same resolution as the app and the scripts.
  dbCredentials: { url: directDatabaseUrl() ?? "" },
  strict: true,
  verbose: true,
});
