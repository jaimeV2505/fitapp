export type AiFailure = "auth" | "model" | "credit" | "busy" | "other";

/**
 * Tells the usual reasons an AI request fails apart, from the HTTP status and message the SDK reports, so the
 * person gets a message they can act on instead of "something went wrong". Pure: easy to test.
 */
export function classifyAiError(error: { status?: number; message?: string }): AiFailure {
  const text = (error.message ?? "").toLowerCase();
  if (/credit balance|billing|insufficient/.test(text)) return "credit";
  if (error.status === 401 || error.status === 403) return "auth";
  if (error.status === 404 || (/model/.test(text) && /not.?found|does not exist|not supported/.test(text))) return "model";
  if (error.status === 429 || error.status === 503 || error.status === 529 || /overloaded/.test(text)) return "busy";
  return "other";
}

/** Reads the HTTP status off whatever was thrown (the Anthropic SDK puts it on `error.status`). */
export function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const status = (error as { status: unknown }).status;
  return typeof status === "number" ? status : undefined;
}
