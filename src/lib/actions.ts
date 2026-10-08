import { ZodError } from "zod";
import { AppError, type ErrorCode } from "@/lib/errors";
import { RateLimitError } from "@/lib/rate-limit";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: ErrorCode; error: string };

/**
 * Wraps the body of a server action: converts expected failures into typed results
 * and hides unexpected ones behind a generic message (details go to the server log).
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, code: error.code, error: error.message };
    if (error instanceof RateLimitError) return { ok: false, code: "rate_limited", error: error.message };
    if (error instanceof ZodError) return { ok: false, code: "validation", error: "Some values are invalid." };
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return { ok: false, code: "unauthenticated", error: "You are signed out. Sign in again." };
    }
    console.error("[action] unexpected error", error);
    return { ok: false, code: "internal", error: "Something went wrong. Try again." };
  }
}
