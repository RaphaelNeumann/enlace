import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to N hits within the window", () => {
    let now = 1_000_000;
    const rl = createRateLimiter({ max: 3, windowMs: 60_000, now: () => now });
    expect(rl.check("ip-a")).toEqual({ ok: true, remaining: 2 });
    expect(rl.check("ip-a")).toEqual({ ok: true, remaining: 1 });
    expect(rl.check("ip-a")).toEqual({ ok: true, remaining: 0 });
  });

  it("denies the (N+1)th hit and reports retryAfterMs", () => {
    let now = 0;
    const rl = createRateLimiter({ max: 2, windowMs: 60_000, now: () => now });
    rl.check("k");
    rl.check("k");
    const denied = rl.check("k");
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.retryAfterMs).toBeGreaterThan(0);
      expect(denied.retryAfterMs).toBeLessThanOrEqual(60_000);
    }
  });

  it("forgets old hits once the window expires", () => {
    let now = 0;
    const rl = createRateLimiter({ max: 1, windowMs: 1_000, now: () => now });
    expect(rl.check("k").ok).toBe(true);
    expect(rl.check("k").ok).toBe(false);
    now = 1_500;
    expect(rl.check("k").ok).toBe(true);
  });

  it("isolates buckets per key", () => {
    let now = 0;
    const rl = createRateLimiter({ max: 1, windowMs: 60_000, now: () => now });
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("b").ok).toBe(true);
    expect(rl.check("a").ok).toBe(false);
    expect(rl.check("b").ok).toBe(false);
  });

  it("reset() drops a key's bucket", () => {
    let now = 0;
    const rl = createRateLimiter({ max: 1, windowMs: 60_000, now: () => now });
    rl.check("k");
    expect(rl.check("k").ok).toBe(false);
    rl.reset("k");
    expect(rl.check("k").ok).toBe(true);
  });

  it("rejects invalid config", () => {
    expect(() => createRateLimiter({ max: 0, windowMs: 1000 })).toThrow();
    expect(() => createRateLimiter({ max: 5, windowMs: 0 })).toThrow();
  });
});
