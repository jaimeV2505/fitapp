import { ZodError } from "zod";
import { AppError, type ErrorCode } from "@/lib/errors";
import { translateError } from "@/lib/i18n/errors";
import { getT } from "@/lib/i18n/server";
import { RateLimitError } from "@/lib/rate-limit";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: ErrorCode; error: string };

/**
 * Wraps the body of a server action: converts expected failures into typed results, in the user's language,
 * and hides unexpected ones behind a generic message (details go to the server log).
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    const t = await getT();
    if (error instanceof AppError) return { ok: false, code: error.code, error: translateError(error.template, error.params, t) };
    if (error instanceof RateLimitError) return { ok: false, code: "rate_limited", error: translateError(error.message, {}, t) };
    if (error instanceof ZodError) return { ok: false, code: "validation", error: t("errors.invalid") };
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return { ok: false, code: "unauthenticated", error: t("errors.signedOut") };
    }
    console.error("[action] unexpected error", error);
    return { ok: false, code: "internal", error: t("errors.internal") };
  }
}
