export interface RateLimitRule {
  /** Maximum number of hits allowed in the window. */
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Abstraction over the rate limiter so the in-memory implementation can be replaced
 * by a shared store (Redis/Upstash) when the app runs on many serverless instances.
 */
export interface RateLimiter {
  check(key: string, rule: RateLimitRule): Promise<RateLimitResult>;
}
