import { describe, expect, it } from "vitest";
import { describeDatabaseUrl, directDatabaseUrl, pooledDatabaseUrl, sameDatabaseHost } from "./url";

describe("database URL resolution", () => {
  it("prefers DATABASE_URL names, then POSTGRES_URL names", () => {
    expect(pooledDatabaseUrl({ DATABASE_URL: "postgres://a", POSTGRES_URL: "postgres://b" })).toBe("postgres://a");
    expect(pooledDatabaseUrl({ POSTGRES_URL: "postgres://b" })).toBe("postgres://b");
  });

  it("uses the direct connection for migrations, falling back to the pooled one", () => {
    expect(directDatabaseUrl({ DATABASE_URL: "postgres://pooled", DATABASE_URL_UNPOOLED: "postgres://direct" })).toBe("postgres://direct");
    expect(directDatabaseUrl({ POSTGRES_URL: "postgres://pooled", POSTGRES_URL_NON_POOLING: "postgres://direct2" })).toBe("postgres://direct2");
    expect(directDatabaseUrl({ DATABASE_URL: "postgres://only" })).toBe("postgres://only");
  });

  it("ignores empty values and strips quotes and spaces", () => {
    expect(pooledDatabaseUrl({ DATABASE_URL: "  ", POSTGRES_URL: ' "postgres://q" ' })).toBe("postgres://q");
    expect(pooledDatabaseUrl({})).toBeUndefined();
  });

  it("describes a URL without credentials", () => {
    expect(describeDatabaseUrl("postgres://user:secret@ep-abc-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require")).toBe(
      "ep-abc-pooler.eu-central-1.aws.neon.tech/neondb",
    );
    expect(describeDatabaseUrl(undefined)).toBe("(not set)");
  });

  it("recognises a pooled and a direct host of the same Neon endpoint", () => {
    expect(sameDatabaseHost("postgres://u:p@ep-abc-pooler.eu.neon.tech/db", "postgres://u:p@ep-abc.eu.neon.tech/db")).toBe(true);
    expect(sameDatabaseHost("postgres://u:p@ep-abc-pooler.eu.neon.tech/db", "postgres://u:p@ep-xyz.us.neon.tech/db")).toBe(false);
  });
});
