interface PgLikeError {
  code?: unknown;
  cause?: unknown;
}

function pgCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const { code, cause } = error as PgLikeError;
  if (typeof code === "string") return code;
  // Drizzle wraps driver errors; the Postgres error is on `cause`.
  return pgCode(cause);
}

/** Postgres SQLSTATE 23505. */
export function isUniqueViolation(error: unknown): boolean {
  return pgCode(error) === "23505";
}
