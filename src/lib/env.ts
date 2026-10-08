import { z } from "zod";

/**
 * Server-side environment, validated once at first import.
 * Never import this file from a client component: it contains secrets.
 */
const booleanString = z
  .enum(["true", "false"])
  .default("true")
  .transform((v) => v === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  ALLOW_SIGNUP: booleanString,
  DEFAULT_TIMEZONE: z.string().min(1).default("UTC"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5-5"),
  STORAGE_DRIVER: z.enum(["local", "vercel-blob"]).default("local"),
  LOCAL_STORAGE_DIR: z.string().default("./.data/uploads"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  /** Set by Vercel when a Blob store is connected. Current stores authenticate with OIDC and need no token. */
  BLOB_STORE_ID: z.string().optional(),
  // Set by Vercel.
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

/** Pasted values often carry stray spaces, newlines or quotes. Normalise them instead of failing the deploy. */
function clean(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  const unquoted = /^(["']).*\1$/.test(trimmed) ? trimmed.slice(1, -1).trim() : trimmed;
  return unquoted;
}

/**
 * Cleans the raw environment and accepts provider aliases: Vercel's Postgres integrations (Neon, Supabase...)
 * may name the connection string POSTGRES_URL instead of DATABASE_URL.
 */
function withProviderAliases(source: NodeJS.ProcessEnv): Record<string, string | undefined> {
  const cleaned: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(source)) cleaned[key] = clean(value);
  return {
    ...cleaned,
    DATABASE_URL: cleaned.DATABASE_URL ?? cleaned.POSTGRES_URL,
    ALLOW_SIGNUP: cleaned.ALLOW_SIGNUP?.toLowerCase(),
  };
}

function parseEnv(): Env {
  const result = schema.safeParse(withProviderAliases(process.env));
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${details}\nSee .env.example.`);
  }
  return result.data;
}

export const env: Env = parseEnv();

/**
 * Public base URL of this deployment. Production and local use BETTER_AUTH_URL; every Vercel preview has its
 * own address, so sign-in works there too. A trailing slash is ignored.
 */
export const appUrl: string = (env.VERCEL_ENV === "preview" && env.VERCEL_URL ? `https://${env.VERCEL_URL}` : env.BETTER_AUTH_URL).replace(/\/+$/, "");

/**
 * Origins the sign-in system accepts requests from. Besides the configured URL, the addresses Vercel assigns to
 * this very project (production domain and the current deployment), so opening the site from any of them works.
 */
export const trustedOrigins: string[] = [
  ...new Set(
    [appUrl, env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`, env.VERCEL_URL && `https://${env.VERCEL_URL}`].filter(
      (origin): origin is string => Boolean(origin),
    ),
  ),
];
