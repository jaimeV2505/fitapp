import type { RateLimiter, RateLimitResult, RateLimitRule } from "./types";

/** Fixed-window in-memory limiter. Good enough for one instance; swap for a shared store at scale. */
export class MemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  async check(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + rule.windowMs });
      this.prune(now);
      return { allowed: true, remaining: rule.limit - 1, retryAfterMs: 0 };
    }

    entry.count += 1;
    const allowed = entry.count <= rule.limit;
    return {
      allowed,
      remaining: Math.max(0, rule.limit - entry.count),
      retryAfterMs: allowed ? 0 : entry.resetAt - now,
    };
  }

  private prune(now: number): void {
    if (this.hits.size < 5000) return;
    for (const [key, entry] of this.hits) {
      if (entry.resetAt <= now) this.hits.delete(key);
    }
  }
}
