import { MemoryRateLimiter } from "./memory";
import type { RateLimiter, RateLimitRule } from "./types";

const globalForLimiter = globalThis as unknown as { __rateLimiter?: RateLimiter };

export const rateLimiter: RateLimiter = globalForLimiter.__rateLimiter ?? new MemoryRateLimiter();
globalForLimiter.__rateLimiter = rateLimiter;

export class RateLimitError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super("Too many requests. Try again in a moment.");
    this.name = "RateLimitError";
  }
}

export async function enforceRateLimit(key: string, rule: RateLimitRule): Promise<void> {
  const result = await rateLimiter.check(key, rule);
  if (!result.allowed) throw new RateLimitError(result.retryAfterMs);
}

export type { RateLimiter, RateLimitRule } from "./types";
