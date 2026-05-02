export interface RateLimiterOptions {
  /** Maximum hits allowed within the window. Must be ≥ 1. */
  max: number;
  /** Window duration in milliseconds. Must be ≥ 1. */
  windowMs: number;
  /** Override the clock — useful for tests. Defaults to Date.now. */
  now?: () => number;
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterMs: number };

export interface RateLimiter {
  check(key: string): RateLimitResult;
  reset(key: string): void;
}

/**
 * In-memory sliding-window rate limiter, keyed by an opaque string (typically
 * the client IP). Sufficient for v1 single-instance deployments. For multi-
 * region Vercel deployments swap the in-memory Map for `@upstash/ratelimit`
 * with the same surface.
 */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  if (!Number.isFinite(options.max) || options.max < 1) {
    throw new Error("rate-limit: max must be ≥ 1");
  }
  if (!Number.isFinite(options.windowMs) || options.windowMs < 1) {
    throw new Error("rate-limit: windowMs must be ≥ 1");
  }
  const max = Math.floor(options.max);
  const windowMs = Math.floor(options.windowMs);
  const now = options.now ?? (() => Date.now());
  const buckets = new Map<string, number[]>();

  return {
    check(key) {
      const ts = now();
      const cutoff = ts - windowMs;
      const list = (buckets.get(key) ?? []).filter((t) => t > cutoff);
      if (list.length >= max) {
        const oldest = list[0];
        return { ok: false, retryAfterMs: Math.max(1, oldest + windowMs - ts) };
      }
      list.push(ts);
      buckets.set(key, list);
      return { ok: true, remaining: max - list.length };
    },
    reset(key) {
      buckets.delete(key);
    },
  };
}
